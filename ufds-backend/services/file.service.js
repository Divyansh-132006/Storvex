import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import mongoose from "mongoose";
import File from "../models/file.model.js";
import { config } from "../config/env.js";

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const sanitizeName = (name) =>
  String(name || "download")
    .replace(/[\/\\\u0000-\u001f\u007f]/g, "_")
    .slice(0, 255) || "download";

const gridFsBucket = () => {
  if (!mongoose.connection.db) throw httpError(503, "Database is not available");
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
};

export const uploadStoredFile = async (req, ownerId) => {
  if (!req.headers["content-type"]?.startsWith("multipart/form-data")) {
    throw httpError(400, "A multipart file upload is required");
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: { files: 1, fields: 0, fileSize: config.maxFileSizeBytes },
  });

  let filePromise;
  let fileSeen = false;
  let parseError;

  busboy.on("file", (fieldName, input, info) => {
    if (fieldName !== "file" || fileSeen) {
      input.resume();
      parseError = httpError(400, "Exactly one file field is required");
      return;
    }

    fileSeen = true;
    filePromise = storeUpload(input, info, ownerId);
  });

  busboy.on("filesLimit", () => {
    parseError = httpError(400, "Exactly one file is allowed");
  });

  busboy.on("error", (error) => {
    parseError = error;
  });

  req.pipe(busboy);

  await new Promise((resolve) => busboy.on("close", resolve));
  if (parseError) throw parseError;
  if (!fileSeen) throw httpError(400, "A file is required");

  const file = await filePromise;
  return {
    id: String(file._id),
    name: file.name,
    mime: file.mimeType,
    size: file.size,
    createdAt: file.createdAt,
  };
};

const storeUpload = async (input, info, ownerId) => {
  const bucket = gridFsBucket();
  const gridFsId = new mongoose.Types.ObjectId();
  const hash = crypto.createHash("sha256");
  let size = 0;
  let limitExceeded = false;

  const uploadStream = bucket.openUploadStreamWithId(
    gridFsId,
    sanitizeName(info.filename),
    {
      contentType: String(info.mimeType || "application/octet-stream").slice(0, 200),
      metadata: { ownerId: String(ownerId) },
    },
  );

  input.on("limit", () => {
    limitExceeded = true;
  });

  const countingStream = new (await import("node:stream")).Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length;
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(input, countingStream, uploadStream);
  } catch (error) {
    await bucket.delete(gridFsId).catch(() => {});
    if (limitExceeded) throw httpError(413, "File exceeds the maximum size");
    throw error;
  }

  if (limitExceeded) {
    await bucket.delete(gridFsId).catch(() => {});
    throw httpError(413, "File exceeds the maximum size");
  }

  try {
    return await File.create({
      ownerId,
      name: sanitizeName(info.filename),
      mimeType: String(info.mimeType || "application/octet-stream").slice(0, 200),
      size,
      gridFsId,
      sha256: hash.digest("hex"),
      status: "uploaded",
    });
  } catch (error) {
    await bucket.delete(gridFsId).catch(() => {});
    throw error;
  }
};

export const listStoredFiles = async (ownerId) =>
  (await File.find({ ownerId, status: "uploaded" })
    .sort({ createdAt: -1 })
    .lean())
    .map((file) => ({
      id: String(file._id),
      name: file.name,
      mime: file.mimeType,
      size: file.size,
      createdAt: file.createdAt,
    }));

export const getDownloadStream = async (ownerId, id) => {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "File not found");
  const file = await File.findOne({
    _id: id,
    ownerId,
    status: "uploaded",
  }).lean();
  if (!file) throw httpError(404, "File not found");

  return {
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    stream: gridFsBucket().openDownloadStream(file.gridFsId),
  };
};

export const deleteStoredFile = async (ownerId, id) => {
  if (!mongoose.isValidObjectId(id)) return;
  const file = await File.findOne({ _id: id, ownerId, status: "uploaded" });
  if (!file) return;

  await gridFsBucket().delete(file.gridFsId);
  await File.deleteOne({ _id: file._id });
};
