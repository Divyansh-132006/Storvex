import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export const REFRESH_COOKIE = "ufds_refresh_token";
export const OAUTH_STATE_COOKIE = "ufds_oauth_state";

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId, type: "access" }, config.accessSecret, {
    expiresIn: config.accessTokenTtl,
  });

export const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: config.nodeEnv === "production" ? "none" : "lax",
  path: "/api/auth",
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};
