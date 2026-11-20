import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createRefreshToken() {
  return crypto.randomBytes(64).toString("base64url");
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.accessSecret,
    { expiresIn: config.accessTokenTtl },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.accessSecret);
}

export function refreshExpiry() {
  return new Date(
    Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  );
}
