import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
  createRefreshToken,
  hashToken,
  refreshExpiry,
  signAccessToken,
} from "../utils/tokens.js";
import { config } from "../config/env.js";

const googleClient = new OAuth2Client(config.googleClientId);

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    authProvider: user.authProvider,
    avatar: user.avatar || null,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function cookieOptions(expires) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: "/api/auth",
    expires,
  };
}

async function issueSession(req, res, user) {
  const rawRefreshToken = createRefreshToken();
  const expiresAt = refreshExpiry();

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt,
    userAgent: req.get("user-agent") || null,
    ip: req.ip || null,
  });

  res.cookie(
    config.refreshCookieName,
    rawRefreshToken,
    cookieOptions(expiresAt),
  );

  return {
    accessToken: signAccessToken(user),
  };
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) {
    throw new ApiError(409, "An account with this email already exists");
  }

  let user;
  try {
    user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      authProvider: "local",
      emailVerified: false,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "An account with this email already exists");
    }
    throw error;
  }

  const { accessToken } = await issueSession(req, res, user);
  res.status(201).json({
    success: true,
    user: safeUser(user),
    accessToken,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !user.passwordHash) {
    if (user?.authProvider === "google" && !user.passwordHash) {
      throw new ApiError(401, "This account uses Google Sign-In");
    }
    throw new ApiError(401, "Invalid email or password");
  }

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken } = await issueSession(req, res, user);
  res.status(200).json({
    success: true,
    user: safeUser(user),
    accessToken,
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: req.body.idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new ApiError(401, "Google account email is not verified");
  }

  const email = payload.email.trim().toLowerCase();
  let user = await User.findOne({ googleId: payload.sub });

  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId = payload.sub;
      user.emailVerified = true;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      await user.save();
    } else {
      user = await User.create({
        name: (payload.name || email.split("@")[0]).trim().slice(0, 60),
        email,
        googleId: payload.sub,
        authProvider: "google",
        avatar: payload.picture || null,
        emailVerified: true,
      });
    }
  }

  const { accessToken } = await issueSession(req, res, user);
  res.status(200).json({
    success: true,
    user: safeUser(user),
    accessToken,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies[config.refreshCookieName];
  if (!rawRefreshToken) {
    throw new ApiError(401, "Authentication required");
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (stored.revokedAt) {
    await RefreshToken.updateMany(
      { user: stored.user, revokedAt: null },
      { revokedAt: new Date() },
    );
    throw new ApiError(401, "Refresh token reuse detected");
  }

  if (stored.expiresAt <= new Date()) {
    await RefreshToken.updateOne(
      { _id: stored._id, revokedAt: null },
      { revokedAt: new Date() },
    );
    throw new ApiError(401, "Invalid refresh token");
  }

  const revokedAt = new Date();
  const claimed = await RefreshToken.findOneAndUpdate(
    { _id: stored._id, revokedAt: null },
    { revokedAt },
    { new: true },
  );

  if (!claimed) {
    await RefreshToken.updateMany(
      { user: stored.user, revokedAt: null },
      { revokedAt: new Date() },
    );
    throw new ApiError(401, "Refresh token reuse detected");
  }

  const user = await User.findById(stored.user);
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }

  const { accessToken } = await issueSession(req, res, user);
  res.status(200).json({
    success: true,
    user: safeUser(user),
    accessToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies[config.refreshCookieName];
  if (rawRefreshToken) {
    await RefreshToken.updateOne(
      { tokenHash: hashToken(rawRefreshToken), revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  res.clearCookie(config.refreshCookieName, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: "/api/auth",
  });
  res.status(200).json({ success: true, message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }
  res.status(200).json({ success: true, user: safeUser(user) });
});
