import crypto from "node:crypto";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import mongoose from "mongoose";
import File from "../models/File.js";
import ShareLink from "../models/ShareLink.js";
import ApiError from "../utils/ApiError.js";
import { config } from "../config/env.js";
import {
  createDecryptStream,
  createEncryptStream,
} from "../crypto/unitCipher.js";
import { decryptMetadata, encryptMetadata } from "../crypto/metaCipher.js";
import {
  deriveFileKey,
  deriveMetaKey,
  getCurrentKeyVersion,
} from "../crypto/keyService.js";
import LocalDiskAdapter from "../storage/LocalDiskAdapter.js";
import {
  getDistributedDownload,
  healthForFile,
  uploadDistributed,
} from "./distributedStorage.service.js";

const storage = new LocalDiskAdapter();
let uploadSequence = 0;

function logUploadStage(uploadId, stage, details = {}) {
  if (config.nodeEnv === "development") {
    console.info(`[upload ${uploadId}] ${stage}`, details);
  }
}

function safeUploadErrorDetails(error) {
  const causes = [error, error?.cause, error?.cause?.cause].filter(Boolean);
  const details = {};
  const name = causes.find((cause) => typeof cause.name === "string")?.name;
  const code = causes.find((cause) => Number.isInteger(cause.code) || (
    typeof cause.code === "string" && /^[A-Z0-9_]{1,40}$/.test(cause.code)
  ))?.code;
  const validationPaths = Object.keys(error?.errors || {});
  const duplicateKeyFields = Object.keys(error?.keyPattern || error?.keyValue || {});

  if (name) details.errorName = name;
  if (code !== undefined) details.errorCode = code;
  if (validationPaths.length) details.validationPaths = validationPaths;
  if (duplicateKeyFields.length) details.duplicateKeyFields = duplicateKeyFields;
  return details;
}

export function sanitizeName(name) {
  return (
    String(name || "download")
      .replace(/[\/\\\u0000-\u001f\u007f]/g, "_")
      .slice(0, 255) || "download"
  );
}

function sizeGuard() {
  let size = 0;
  return {
    size: () => size,
    stream: new Transform({
      transform(chunk, encoding, callback) {
        size += chunk.length;
        if (size > config.maxFileSizeBytes)
          return callback(new ApiError(413, "File exceeds the maximum size"));
        callback(null, chunk);
      },
    }),
  };
}

async function committedBytes(userId) {
  const [result] = await File.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        status: "committed",
      },
    },
    { $group: { _id: null, total: { $sum: { $multiply: ["$ciphertextSize", 1.25] } } } },
  ]);
  return result?.total || 0;
}

export async function uploadFile(req) {
  const uploadId = ++uploadSequence;
  const uploadStartedAt = Date.now();
  logUploadStage(uploadId, "request received");
  const quotaStartedAt = Date.now();
  if ((await committedBytes(req.user.id)) >= config.maxUserStorageBytes) {
    throw new ApiError(413, "Storage quota exceeded");
  }
  logUploadStage(uploadId, "quota check complete", {
    durationMs: Date.now() - quotaStartedAt,
  });
  const busboy = Busboy({
    headers: req.headers,
    limits: { files: 2, fileSize: config.maxFileSizeBytes + 1 },
  });
  let filePromise;
  let fileSeen = false;
  let fileStream;
  let parseError;
  busboy.on("file", (field, stream, info) => {
    if (field !== "file" || fileSeen) {
      stream.resume();
      parseError = new ApiError(400, "Exactly one file field is required");
      return;
    }
    fileSeen = true;
    fileStream = stream;
    logUploadStage(uploadId, "multipart file part received", {
      elapsedMs: Date.now() - uploadStartedAt,
    });
    filePromise = uploadDistributed(
      stream,
      info,
      req.user.id,
      String(req.headers["idempotency-key"] || "").slice(0, 200) || undefined,
    ).then(
      (value) => {
        logUploadStage(uploadId, "distributed upload complete", {
          elapsedMs: Date.now() - uploadStartedAt,
        });
        return { value };
      },
      (error) => {
        logUploadStage(uploadId, "distributed upload failed", {
          elapsedMs: Date.now() - uploadStartedAt,
          ...safeUploadErrorDetails(error),
        });
        return { error };
      },
    );
    stream.on("limit", () => {
      parseError = new ApiError(413, "File exceeds the maximum size");
      if (!stream.destroyed) stream.destroy();
    });
  });
  busboy.on("error", (error) => {
    parseError = error;
  });
  req.once("aborted", () => {
    parseError = new ApiError(400, "Upload was aborted");
    logUploadStage(uploadId, "request aborted", {
      elapsedMs: Date.now() - uploadStartedAt,
    });
    if (fileStream && !fileStream.destroyed) fileStream.destroy();
    if (!busboy.destroyed) busboy.destroy();
  });
  req.pipe(busboy);
  await new Promise((resolve, reject) => {
    busboy.on("close", resolve);
    busboy.on("error", reject);
  });
  if (filePromise) {
    const outcome = await filePromise;
    if (parseError) throw parseError;
    if ("error" in outcome) throw outcome.error;
    return outcome.value;
  }
  if (parseError) throw parseError;
  throw new ApiError(400, "A file is required");
}

async function processUpload(input, info, userId) {
  const fileId = new mongoose.Types.ObjectId();
  const storageKey = crypto.randomBytes(32).toString("hex");
  const fileSalt = crypto.randomBytes(32);
  const keyVersion = getCurrentKeyVersion();
  const doc = new File({
    _id: fileId,
    user_id: userId,
    status: "pending",
    storageMode: "single",
    originalSize: 0,
    unitSize: config.unitSize,
    unitCount: 1,
    ciphertextSize: 0,
    encryption: {
      algo: "chacha20-poly1305",
      keyVersion,
      fileSalt: fileSalt.toString("base64"),
    },
    metaEnc: encryptMetadata(
      { name: "", mime: "" },
      deriveMetaKey(fileId, fileSalt, keyVersion),
      fileId,
    ),
    ciphertextSha256: "0".repeat(64),
    storageKey,
  });
  await doc.save();
  try {
    const guard = sizeGuard();
    const encrypted = createEncryptStream({
      key: deriveFileKey(fileId, fileSalt, keyVersion),
      fileId,
    });
    const resultPromise = storage.putStream(storageKey, encrypted);
    await pipeline(input, guard.stream, encrypted);
    const result = await resultPromise;
    const originalSize = guard.size();
    if (
      originalSize >
      config.maxUserStorageBytes - (await committedBytes(userId))
    ) {
      throw new ApiError(413, "Storage quota exceeded");
    }
    const unitCount = Math.max(1, Math.ceil(originalSize / config.unitSize));
    doc.set({
      status: "committed",
      originalSize,
      unitCount,
      ciphertextSize: result.size,
      metaEnc: encryptMetadata(
        {
          name: sanitizeName(info.filename),
          mime: String(info.mimeType || "application/octet-stream").slice(
            0,
            200,
          ),
        },
        deriveMetaKey(fileId, fileSalt, keyVersion),
        fileId,
      ),
      ciphertextSha256: result.sha256,
    });
    await doc.save();
    return {
      id: String(fileId),
      name: sanitizeName(info.filename),
      mime: info.mimeType || "application/octet-stream",
      size: originalSize,
      createdAt: doc.createdAt,
    };
  } catch (error) {
    await storage.delete(storageKey);
    await File.updateOne({ _id: fileId }, { $set: { status: "failed" } });
    throw error;
  }
}

export async function listFiles(userId) {
  const files = await File.find({ user_id: userId, status: "committed" })
    .sort({ createdAt: -1 })
    .lean();
  return files.map((file) => {
    const salt = Buffer.from(file.encryption.fileSalt, "base64");
    const meta = decryptMetadata(
      file.metaEnc,
      deriveMetaKey(file._id, salt, file.encryption.keyVersion),
      file._id,
    );
    return {
      id: String(file._id),
      ...meta,
      size: file.originalSize,
      createdAt: file.createdAt,
    };
  });
}

async function verifyHash(file) {
  const hash = crypto.createHash("sha256");
  await pipeline(
    storage.getStream(file.storageKey),
    new Writable({
      write(chunk, encoding, callback) {
        hash.update(chunk);
        callback();
      },
    }),
  );
  if (hash.digest("hex") !== file.ciphertextSha256)
    throw new ApiError(500, "Stored file integrity check failed");
}

export async function getDownload(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "File not found");
  const file = await File.findOne({
    _id: id,
    user_id: userId,
    status: "committed",
  }).lean();
  if (!file) throw new ApiError(404, "File not found");
  if (file.storageMode === "ec-4+1") return getDistributedDownload(file);
  const salt = Buffer.from(file.encryption.fileSalt, "base64");
  const key = deriveFileKey(file._id, salt, file.encryption.keyVersion);
  const meta = decryptMetadata(
    file.metaEnc,
    deriveMetaKey(file._id, salt, file.encryption.keyVersion),
    file._id,
  );
  if (config.verifyCiphertextHashOnDownload) await verifyHash(file);
  await pipeline(
    storage.getStream(file.storageKey),
    createDecryptStream({
      key,
      fileId: file._id,
      unitCount: file.unitCount,
    }),
    new Writable({
      write(chunk, encoding, callback) {
        callback();
      },
    }),
  );
  return {
    file,
    meta,
    stream: storage.getStream(file.storageKey).pipe(
      createDecryptStream({
        key,
        fileId: file._id,
        unitCount: file.unitCount,
      }),
    ),
  };
}

export async function deleteFile(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "File not found");
  const file = await File.findOne({ _id: id, user_id: userId });
  if (!file) throw new ApiError(404, "File not found");
  if (file.storageMode === "ec-4+1") {
    const { default: Shard } = await import("../models/Shard.js");
    const { default: providers } = await import("../providers/registry.js");
    const shards = await Shard.find({ fileId: file._id }).lean();
    await Promise.allSettled(shards.map((shard) => providers[shard.position].deleteObject(shard.objectKey)));
    await Shard.deleteMany({ fileId: file._id });
  } else {
    await storage.delete(file.storageKey);
  }
  await ShareLink.deleteMany({ fileId: file._id });
  await File.deleteOne({ _id: file._id });
}

export async function fileHealth(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "File not found");
  const file = await File.findOne({ _id: id, user_id: userId, status: "committed" }).lean();
  if (!file) throw new ApiError(404, "File not found");
  if (file.storageMode !== "ec-4+1") return { groups: 1, healthyGroups: 1, degradedGroups: 0, unrecoverableGroups: 0, status: "healthy" };
  return healthForFile(file._id);
}
