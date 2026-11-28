import crypto from "node:crypto";
import { Transform, Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import mongoose from "mongoose";
import File from "../models/File.js";
import Shard from "../models/Shard.js";
import Event from "../models/Event.js";
import { config } from "../config/env.js";
import { createDecryptStream, createEncryptStream } from "../crypto/unitCipher.js";
import { deriveFileKey, deriveMetaKey, getCurrentKeyVersion } from "../crypto/keyService.js";
import { encryptMetadata, decryptMetadata } from "../crypto/metaCipher.js";
import { createBlockSplitter } from "../erasure/blockSplitter.js";
import { assembleGroup } from "../erasure/groupAssembler.js";
import { reconstructGroup } from "../erasure/reconstruct.js";
import providers from "../providers/registry.js";
import ApiError from "../utils/ApiError.js";

function sanitizeName(name) {
  return String(name || "download").replace(/[\/\\\u0000-\u001f\u007f]/g, "_").slice(0, 255) || "download";
}

function hash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function logUploadStage(stage, details = {}) {
  if (config.nodeEnv === "development") {
    console.info(`[storage upload] ${stage}`, details);
  }
}

async function putShard(shard, bytes) {
  const provider = providers[shard.position];
  const result = await provider.putObject(shard.objectKey, bytes);
  if (result.size !== bytes.length) throw new Error("Provider returned an invalid shard size");
  if (config.verifyReadback && hash(await provider.getObject(shard.objectKey)) !== shard.sha256) {
    throw new Error("Shard readback verification failed");
  }
  return shard;
}

export async function uploadDistributed(input, info, userId, idempotencyKey) {
  if (idempotencyKey) {
    const existing = await File.findOne({ user_id: userId, idempotencyKey, status: { $ne: "failed" } }).lean();
    if (existing) return fileResponse(existing);
  }
  const fileId = new mongoose.Types.ObjectId();
  const salt = crypto.randomBytes(32);
  const keyVersion = getCurrentKeyVersion();
  const doc = new File({
    _id: fileId,
    user_id: userId,
    status: "pending",
    storageMode: "ec-4+1",
    shardSize: config.shardSizeBytes,
    originalSize: 0,
    unitSize: config.unitSize,
    unitCount: 1,
    ciphertextSize: 0,
    groupCount: 0,
    encryption: { algo: "chacha20-poly1305", keyVersion, fileSalt: salt.toString("base64") },
    metaEnc: encryptMetadata({ name: "", mime: "" }, deriveMetaKey(fileId, salt, keyVersion), fileId),
    ciphertextSha256: "0".repeat(64),
    storageKey: crypto.randomBytes(32).toString("hex"),
    idempotencyKey: idempotencyKey || undefined,
  });
  const uploaded = [];
  let sourcePipeline;
  try {
    const metadataStartedAt = Date.now();
    logUploadStage("metadata save started");
    await doc.save();
    logUploadStage("metadata save complete", {
      durationMs: Date.now() - metadataStartedAt,
    });
    let originalSize = 0;
    let ciphertextSize = 0;
    let unitCount = 0;
    let groupCount = 0;
    const ciphertextHash = crypto.createHash("sha256");
    const guard = new Transform({
      transform(chunk, encoding, callback) {
        originalSize += chunk.length;
        if (originalSize > config.maxFileSizeBytes) return callback(new ApiError(413, "File exceeds the maximum size"));
        callback(null, chunk);
      },
    });
    const countCiphertext = new Transform({
      transform(chunk, encoding, callback) {
        ciphertextSize += chunk.length;
        ciphertextHash.update(chunk);
        callback(null, chunk);
      },
    });
    const encrypted = createEncryptStream({ key: deriveFileKey(fileId, salt, keyVersion), fileId });
    const splitter = createBlockSplitter(config.shardSizeBytes);
    sourcePipeline = pipeline(input, guard, encrypted, countCiphertext, splitter);
    sourcePipeline.catch(() => {});
    let blocks = [];
    for await (const block of splitter) {
      blocks.push(block);
      if (blocks.length < 4) continue;
      const groupStartedAt = Date.now();
      logUploadStage("provider group write started", { groupNo: groupCount });
      await storeGroup(blocks, groupCount++, fileId, userId, uploaded);
      logUploadStage("provider group write complete", {
        durationMs: Date.now() - groupStartedAt,
      });
      blocks = [];
    }
    await sourcePipeline;
    if (blocks.length) {
      const groupStartedAt = Date.now();
      logUploadStage("provider group write started", { groupNo: groupCount });
      await storeGroup(blocks, groupCount++, fileId, userId, uploaded);
      logUploadStage("provider group write complete", {
        durationMs: Date.now() - groupStartedAt,
      });
    }
    unitCount = Math.max(1, Math.ceil(originalSize / config.unitSize));
    const [quota] = await File.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId), status: "committed" } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$ciphertextSize", 1.25] } } } },
    ]);
    if (ciphertextSize * 1.25 > config.maxUserStorageBytes - (quota?.total || 0)) {
      throw new ApiError(413, "Storage quota exceeded");
    }
    doc.set({
      status: "verified",
      originalSize,
      unitCount,
      ciphertextSize,
      groupCount,
      metaEnc: encryptMetadata(
        { name: sanitizeName(info.filename), mime: String(info.mimeType || "application/octet-stream").slice(0, 200) },
        deriveMetaKey(fileId, salt, keyVersion),
        fileId,
      ),
      ciphertextSha256: ciphertextHash.digest("hex"),
    });
    await doc.save();
    doc.status = "committed";
    await doc.save();
    return fileResponse(doc);
  } catch (error) {
    if (sourcePipeline) await Promise.allSettled([sourcePipeline]);
    await Promise.allSettled(uploaded.map(async (shard) => providers[shard.position].deleteObject(shard.objectKey)));
    await Shard.deleteMany({ fileId });
    await File.updateOne(
      { _id: fileId },
      { $set: { status: "failed" }, $unset: { idempotencyKey: 1 } },
    );
    throw error;
  }
}

async function storeGroup(blocks, groupNo, fileId, userId, uploaded) {
  const assembled = assembleGroup(blocks, groupNo, config.shardSizeBytes);
  const docs = assembled.map((shard) => ({
    _id: new mongoose.Types.ObjectId(),
    fileId,
    userId,
    groupNo,
    position: shard.position,
    role: shard.role,
    dataIndex: shard.dataIndex,
    objectKey: crypto.randomBytes(24).toString("hex"),
    size: shard.bytes.length,
    sha256: hash(shard.bytes),
    status: "pending",
    providerIndex: shard.position,
  }));
  await Shard.insertMany(docs);
  try {
    const results = await Promise.allSettled(assembled.map(async (shard, index) => {
      await putShard(docs[index], shard.bytes);
      docs[index].status = "verified";
      docs[index].lastVerifiedAt = new Date();
      uploaded.push(docs[index]);
      await Shard.updateOne({ _id: docs[index]._id }, { $set: { status: "verified", lastVerifiedAt: docs[index].lastVerifiedAt } });
    }));
    const verified = results.filter((result) => result.status === "fulfilled").length;
    if (verified < config.uploadMinShardsPerGroup) {
      const firstRejected = results.find((result) => result.status === "rejected");
      const reason = firstRejected?.reason instanceof Error
        ? firstRejected.reason.message.slice(0, 160)
        : "unknown provider error";
      throw new Error(`Not enough verified shards for upload: ${reason}`);
    }
    await Promise.all(results.map((result, index) => result.status === "rejected"
      ? Shard.updateOne({ _id: docs[index]._id }, { $set: { status: "missing" } })
      : Promise.resolve()));
  } catch (error) {
    await Promise.allSettled(docs.map(async (doc) => providers[doc.position].deleteObject(doc.objectKey)));
    await Shard.deleteMany({ fileId, groupNo });
    throw error;
  }
}

export async function getDistributedDownload(file) {
  const salt = Buffer.from(file.encryption.fileSalt, "base64");
  const metadata = decryptMetadata(file.metaEnc, deriveMetaKey(file._id, salt, file.encryption.keyVersion), file._id);
  const key = deriveFileKey(file._id, salt, file.encryption.keyVersion);
  const allShards = await Shard.find({ fileId: file._id }).sort({ groupNo: 1, position: 1 }).lean();
  const groups = Array.from({ length: file.groupCount }, (_, groupNo) =>
    allShards.filter((shard) => shard.groupNo === groupNo),
  );
  for (const group of groups) {
    const unavailable = group.filter((shard) =>
      ["missing", "corrupt"].includes(shard.status) ||
      providers[shard.providerIndex].health().state === "down",
    ).length;
    if (unavailable > 1) {
      throw new ApiError(503, "This file cannot be recovered");
    }
  }
  let recoveredGroups = 0;
  async function* ciphertext() {
    let remaining = file.ciphertextSize;
    for (const group of groups) {
      const slots = Array(5).fill(null);
      await Promise.all(group.map(async (shard) => {
        if (["missing", "corrupt"].includes(shard.status)) return;
        try {
          const bytes = await providers[shard.position].getObject(shard.objectKey);
          if (bytes.length !== shard.size || hash(bytes) !== shard.sha256) {
            await Shard.updateOne({ _id: shard._id }, { $set: { status: "corrupt" } });
            return;
          }
          slots[shard.position] = bytes;
        } catch {
          await Shard.updateOne({ _id: shard._id }, { $set: { status: "missing" } });
        }
      }));
      const missing = slots.filter((slot) => !slot).length;
      if (missing > 1) throw new ApiError(503, "This file cannot be recovered");
      if (missing) recoveredGroups += 1;
      for (const block of reconstructGroup(slots, group[0]?.groupNo ?? 0)) {
        if (!remaining) break;
        const output = block.subarray(0, Math.min(remaining, block.length));
        remaining -= output.length;
        yield output;
      }
    }
  }
  const discardPlaintext = new Writable({
    write(chunk, encoding, callback) {
      callback();
    },
  });
  await pipeline(
    Readable.from(ciphertext()),
    createDecryptStream({ key, fileId: file._id, unitCount: file.unitCount }),
    discardPlaintext,
  );
  if (recoveredGroups) {
    await Event.create({ fileId: file._id, userId: file.user_id, type: "download_recovered", details: { groups: recoveredGroups } });
  }
  return {
    file,
    meta: metadata,
    stream: Readable.from(ciphertext()).pipe(
      createDecryptStream({
        key,
        fileId: file._id,
        unitCount: file.unitCount,
      }),
    ),
  };
}

export async function healthForFile(fileId) {
  const shards = await Shard.find({ fileId }).lean();
  const groups = new Map();
  for (const shard of shards) {
    if (!groups.has(shard.groupNo)) groups.set(shard.groupNo, []);
    groups.get(shard.groupNo).push(shard);
  }
  let healthyGroups = 0;
  let degradedGroups = 0;
  for (const group of groups.values()) {
    const healthy = group.filter((shard) => !["missing", "corrupt"].includes(shard.status)).length;
    if (healthy >= 5) healthyGroups += 1;
    else if (healthy >= 4) degradedGroups += 1;
  }
  const unrecoverableGroups = groups.size - healthyGroups - degradedGroups;
  return {
    groups: groups.size,
    healthyGroups,
    degradedGroups,
    unrecoverableGroups,
    status: unrecoverableGroups ? "unrecoverable" : degradedGroups ? "degraded" : "healthy",
    providers: providers.map((provider, index) => ({ ...provider.health(), index, shardCount: shards.filter((shard) => shard.providerIndex === index).length })),
  };
}

function fileResponse(file) {
  const salt = Buffer.from(file.encryption.fileSalt, "base64");
  const metadata = decryptMetadata(file.metaEnc, deriveMetaKey(file._id, salt, file.encryption.keyVersion), file._id);
  return { id: String(file._id), ...metadata, size: file.originalSize, createdAt: file.createdAt };
}
