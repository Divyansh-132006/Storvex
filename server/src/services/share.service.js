import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { setTimeout as delay } from "node:timers/promises";
import Event from "../models/Event.js";
import File from "../models/File.js";
import ShareLink from "../models/ShareLink.js";
import { config } from "../config/env.js";
import { decryptMetadata } from "../crypto/metaCipher.js";
import { deriveMetaKey } from "../crypto/keyService.js";
import ApiError from "../utils/ApiError.js";
import { getDownload } from "./file.service.js";

const EXPIRY_OPTIONS = Object.freeze({
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
});
const PASSWORD_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const PASSWORD_ATTEMPT_LIMIT = 5;
const PASSWORD_ATTEMPT_DELAY_MS = 100;
const MAX_PASSWORD_ATTEMPT_KEYS = 5000;
const passwordAttempts = new Map();

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function unavailable() {
  return new ApiError(404, "Link not available");
}

function getStatus(link, now = new Date()) {
  if (link.revokedAt) return "revoked";
  if (link.expiresAt <= now) return "expired";
  if (link.maxDownloads && link.downloadCount >= link.maxDownloads)
    return "exhausted";
  return "active";
}

async function findOwnedCommittedFile(ownerId, fileId) {
  if (!mongoose.isValidObjectId(fileId)) return null;
  return File.findOne({
    _id: fileId,
    user_id: ownerId,
    status: "committed",
  }).lean();
}

async function findAvailableShare(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token))
    return null;
  const link = await ShareLink.findOne({ tokenHash: hashToken(token) })
    .select("+passwordHash +tokenHash")
    .lean();
  if (!link || getStatus(link) !== "active") return null;
  const file = await File.findOne({
    _id: link.fileId,
    user_id: link.ownerId,
    status: "committed",
  }).lean();
  return file ? { link, file } : null;
}

function getPasswordAttemptKey(tokenHash, ip) {
  return crypto
    .createHash("sha256")
    .update(`${tokenHash}:${String(ip || "unknown")}`)
    .digest("hex");
}

function allowPasswordAttempt(key, now = Date.now()) {
  let entry = passwordAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    if (passwordAttempts.size >= MAX_PASSWORD_ATTEMPT_KEYS) {
      for (const [existingKey, existing] of passwordAttempts) {
        if (existing.resetAt <= now) passwordAttempts.delete(existingKey);
      }
      if (passwordAttempts.size >= MAX_PASSWORD_ATTEMPT_KEYS) {
        const oldestKey = passwordAttempts.keys().next().value;
        if (oldestKey) passwordAttempts.delete(oldestKey);
      }
    }
    entry = { count: 0, resetAt: now + PASSWORD_ATTEMPT_WINDOW_MS };
  }
  if (entry.count >= PASSWORD_ATTEMPT_LIMIT) return false;
  entry.count += 1;
  passwordAttempts.set(key, entry);
  return true;
}

export async function createShareLink(ownerId, fileId, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) input = {};
  const file = await findOwnedCommittedFile(ownerId, fileId);
  if (!file) throw new ApiError(404, "File not found");
  if (!Object.prototype.hasOwnProperty.call(EXPIRY_OPTIONS, input?.expiresIn))
    throw new ApiError(400, "Invalid link expiry");

  const maxDownloads = input.maxDownloads;
  if (
    maxDownloads !== undefined &&
    (!Number.isInteger(maxDownloads) || maxDownloads < 1 || maxDownloads > 1000)
  ) {
    throw new ApiError(400, "Invalid download limit");
  }
  if (
    input.password !== undefined &&
    (typeof input.password !== "string" ||
      input.password.length < 1 ||
      input.password.length > 128)
  ) {
    throw new ApiError(400, "Invalid password");
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const link = new ShareLink({
    fileId: file._id,
    ownerId: file.user_id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EXPIRY_OPTIONS[input.expiresIn]),
    maxDownloads,
    passwordHash:
      input.password === undefined
        ? undefined
        : await bcrypt.hash(input.password, 12),
  });
  await link.save();

  try {
    await Event.create({
      fileId: file._id,
      userId: file.user_id,
      type: "share_created",
      details: { shareId: String(link._id) },
    });
  } catch (error) {
    await ShareLink.deleteOne({ _id: link._id });
    throw error;
  }

  return {
    shareId: String(link._id),
    url: `${config.clientUrl.replace(/\/+$/, "")}/s/${token}`,
    expiresAt: link.expiresAt,
    maxDownloads: link.maxDownloads ?? null,
  };
}

export async function listShareLinks(ownerId, fileId) {
  const file = await findOwnedCommittedFile(ownerId, fileId);
  if (!file) throw new ApiError(404, "File not found");
  const links = await ShareLink.find({ fileId: file._id, ownerId })
    .sort({ createdAt: -1 })
    .select("+passwordHash")
    .lean();
  const now = new Date();
  return links.map((link) => ({
    shareId: String(link._id),
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
    maxDownloads: link.maxDownloads ?? null,
    downloadCount: link.downloadCount,
    status: getStatus(link, now),
    hasPassword: Boolean(link.passwordHash),
  }));
}

export async function revokeShareLink(ownerId, shareId) {
  if (!mongoose.isValidObjectId(shareId))
    throw new ApiError(404, "Share link not found");
  const link = await ShareLink.findOne({ _id: shareId, ownerId }).lean();
  if (!link) throw new ApiError(404, "Share link not found");
  const now = new Date();
  const result = await ShareLink.updateOne(
    { _id: link._id, ownerId, revokedAt: null },
    { $set: { revokedAt: now } },
  );
  if (result.modifiedCount) {
    await Event.create({
      fileId: link.fileId,
      userId: link.ownerId,
      type: "share_revoked",
      details: { shareId: String(link._id) },
    });
  }
  return { success: true };
}

export async function getShareInfo(token) {
  const result = await findAvailableShare(token);
  if (!result) throw unavailable();
  const now = new Date();
  const updated = await ShareLink.updateOne(
    {
      _id: result.link._id,
      revokedAt: null,
      expiresAt: { $gt: now },
      $or: [
        { maxDownloads: { $exists: false } },
        { maxDownloads: null },
        { $expr: { $lt: ["$downloadCount", "$maxDownloads"] } },
      ],
    },
    { $set: { lastAccessedAt: now } },
  );
  if (!updated.matchedCount) throw unavailable();
  const salt = Buffer.from(result.file.encryption.fileSalt, "base64");
  const metadata = decryptMetadata(
    result.file.metaEnc,
    deriveMetaKey(
      result.file._id,
      salt,
      result.file.encryption.keyVersion,
    ),
    result.file._id,
  );
  return {
    fileName: metadata.name,
    size: result.file.originalSize,
    mimeType: metadata.mime,
    expiresAt: result.link.expiresAt,
    requiresPassword: Boolean(result.link.passwordHash),
  };
}

export async function prepareShareDownload(token, password, ip) {
  const result = await findAvailableShare(token);
  if (!result) throw unavailable();

  if (result.link.passwordHash) {
    const attemptKey = getPasswordAttemptKey(result.link.tokenHash, ip);
    if (!allowPasswordAttempt(attemptKey)) {
      await delay(PASSWORD_ATTEMPT_DELAY_MS);
      throw new ApiError(429, "Too many attempts. Try again later.");
    }
    await delay(PASSWORD_ATTEMPT_DELAY_MS);
    if (
      typeof password !== "string" ||
      !(await bcrypt.compare(password, result.link.passwordHash))
    ) {
      throw new ApiError(401, "Invalid password");
    }
  }

  const now = new Date();
  const claimed = await ShareLink.findOneAndUpdate(
    {
      _id: result.link._id,
      revokedAt: null,
      expiresAt: { $gt: now },
      $or: [
        { maxDownloads: { $exists: false } },
        { maxDownloads: null },
        { $expr: { $lt: ["$downloadCount", "$maxDownloads"] } },
      ],
    },
    {
      $inc: { downloadCount: 1 },
      $set: { lastAccessedAt: now },
    },
    { new: true },
  ).lean();
  if (!claimed) throw unavailable();

  try {
    const download = await getDownload(String(result.file.user_id), String(result.file._id));
    await Event.create({
      fileId: result.file._id,
      userId: result.file.user_id,
      type: "share_download",
      details: {
        shareId: String(claimed._id),
        downloadCount: claimed.downloadCount,
      },
    });
    return { ...download, shareId: String(claimed._id) };
  } catch (error) {
    await ShareLink.updateOne(
      { _id: claimed._id, downloadCount: { $gt: 0 } },
      { $inc: { downloadCount: -1 } },
    );
    if (error.statusCode === 404) throw unavailable();
    throw error;
  }
}

export async function rollbackShareDownload(shareId) {
  await ShareLink.updateOne(
    { _id: shareId, downloadCount: { $gt: 0 } },
    { $inc: { downloadCount: -1 } },
  );
}
