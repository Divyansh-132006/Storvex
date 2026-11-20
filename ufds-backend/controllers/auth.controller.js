import crypto from "node:crypto";
import { parse } from "cookie";
import { OAuth2Client } from "google-auth-library";
import { config, isProduction } from "../config/env.js";
import {
  OAUTH_STATE_COOKIE, REFRESH_COOKIE, cookieOptions, publicUser,
} from "../utils/auth.js";
import * as authService from "../services/auth.service.js";

const oauthClient = new OAuth2Client(config.googleClientId, config.googleClientSecret, config.googleCallbackUrl);
const setRefreshCookie = (res, token) => res.cookie(REFRESH_COOKIE, token, { ...cookieOptions, maxAge: config.refreshTokenTtlDays * 86400000 });
const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, cookieOptions);
const sendAuth = (res, result) => {
  setRefreshCookie(res, result.refreshToken);
  return res.json({ success: true, accessToken: result.accessToken, user: result.user });
};

export const register = async (req, res, next) => {
  try {
    const name = req.body.name || req.body.fullName;
    return sendAuth(res, await authService.register({ ...req.body, name }));
  } catch (error) { return next(error); }
};
export const login = async (req, res, next) => {
  try { return sendAuth(res, await authService.login(req.body)); } catch (error) { return next(error); }
};
export const refresh = async (req, res, next) => {
  try {
    const token = parse(req.headers.cookie || "")[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
    return sendAuth(res, await authService.refresh(token));
  } catch (error) { return next(error); }
};
export const logout = async (req, res, next) => {
  try {
    await authService.logout(parse(req.headers.cookie || "")[REFRESH_COOKIE]);
    clearRefreshCookie(res);
    return res.status(204).send();
  } catch (error) { return next(error); }
};
export const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.id);
    clearRefreshCookie(res);
    return res.status(204).send();
  } catch (error) { return next(error); }
};
export const me = (req, res) => res.json({ success: true, user: publicUser(req.user) });
export const sessions = async (req, res, next) => {
  try {
    const activeSessions = await authService.listSessions(req.user.id);
    return res.json({ success: true, sessions: activeSessions });
  } catch (error) { return next(error); }
};
export const revokeSession = async (req, res, next) => {
  try {
    const revoked = await authService.revokeSession(req.user.id, req.params.sessionId);
    if (!revoked) return res.status(404).json({ success: false, message: "Session not found" });
    return res.status(204).send();
  } catch (error) { return next(error); }
};
export const google = (req, res) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.status(503).json({
      success: false,
      message: "Google Sign-In is not configured",
    });
  }
  const state = crypto.randomBytes(32).toString("hex");
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true, secure: isProduction, sameSite: "lax", maxAge: 10 * 60 * 1000, path: "/api/auth",
  });
  return res.redirect(oauthClient.generateAuthUrl({
    access_type: "offline", scope: ["openid", "email", "profile"], state, prompt: "select_account",
  }));
};
export const googleCallback = async (req, res, next) => {
  try {
    if (!config.googleClientId || !config.googleClientSecret) {
      throw Object.assign(new Error("Google Sign-In is not configured"), { statusCode: 503 });
    }
    const cookies = parse(req.headers.cookie || "");
    if (!req.query.state || req.query.state !== cookies[OAUTH_STATE_COOKIE]) {
      return res.status(400).json({ success: false, message: "Invalid OAuth state" });
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { httpOnly: true, secure: isProduction, sameSite: "lax", path: "/api/auth" });
    const result = await authService.googleLogin(req.query.code);
    setRefreshCookie(res, result.refreshToken);
    return res.redirect(`${config.frontendUrl}/`);
  } catch (error) { return next(error); }
};
