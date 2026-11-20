import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import RefreshToken from "../models/refresh-token.model.js";
import { config } from "../config/env.js";
import { hashToken, publicUser, signAccessToken } from "../utils/auth.js";

const googleClient = new OAuth2Client(
  config.googleClientId, config.googleClientSecret, config.googleCallbackUrl,
);

const authError = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const createSession = async (userId, familyId = crypto.randomUUID()) => {
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  const session = await RefreshToken.create({
    userId, familyId, tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + config.refreshTokenTtlDays * 86400000),
  });
  return { accessToken: signAccessToken(userId.toString()), refreshToken, sessionId: session.id };
};

export const register = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    const error = new Error("Unable to create account with those details");
    error.statusCode = 409;
    throw error;
  }
  const user = await User.create({
    name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12),
    authProviders: ["password"],
  });
  return { user: publicUser(user), ...(await createSession(user.id)) };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  if (!user?.isActive || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw authError("Invalid email or password");
  }
  return { user: publicUser(user), ...(await createSession(user.id)) };
};

export const refresh = async (token) => {
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(token) }).select("+tokenHash");
  if (!stored) throw authError("Invalid refresh token");
  if (stored.revokedAt) {
    await RefreshToken.updateMany({ familyId: stored.familyId, revokedAt: null }, { revokedAt: new Date() });
    throw authError("Refresh token reuse detected");
  }
  if (stored.expiresAt <= new Date()) throw authError("Invalid refresh token");

  const revokedAt = new Date();
  const claimed = await RefreshToken.findOneAndUpdate(
    { _id: stored.id, revokedAt: null },
    { revokedAt },
    { new: true },
  );
  if (!claimed) {
    await RefreshToken.updateMany({ familyId: stored.familyId, revokedAt: null }, { revokedAt });
    throw authError("Refresh token reuse detected");
  }
  const replacement = await createSession(stored.userId, stored.familyId);
  await RefreshToken.updateOne({ _id: claimed.id }, { replacedByTokenId: replacement.sessionId });
  const user = await User.findById(stored.userId);
  if (!user?.isActive) throw authError("Authentication required");
  return { ...replacement, user: publicUser(user) };
};

export const logout = async (token) => {
  if (token) await RefreshToken.updateOne({ tokenHash: hashToken(token), revokedAt: null }, { revokedAt: new Date() });
};

export const logoutAll = (userId) =>
  RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });

export const getUser = (id) => User.findOne({ _id: id, isActive: true });

export const listSessions = (userId) =>
  RefreshToken.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .select("createdAt expiresAt familyId").sort({ createdAt: -1 }).lean();

export const revokeSession = async (userId, sessionId) => {
  const result = await RefreshToken.updateOne(
    { _id: sessionId, userId, revokedAt: null }, { revokedAt: new Date() },
  );
  return result.modifiedCount === 1;
};

export const googleLogin = async (code) => {
  const { tokens } = await googleClient.getToken(code);
  if (!tokens.id_token) throw authError("Invalid Google identity");
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token, audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw authError("Google account email is not verified");
  }
  const email = payload.email.trim().toLowerCase();
  let user = await User.findOne({ googleId: payload.sub }).select("+googleId");
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId = payload.sub;
      user.emailVerified = true;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      if (!user.authProviders.includes("google")) user.authProviders.push("google");
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || email.split("@")[0], email, googleId: payload.sub,
        avatar: payload.picture || null, emailVerified: true, authProviders: ["google"],
      });
    }
  }
  return { user: publicUser(user), ...(await createSession(user.id)) };
};
