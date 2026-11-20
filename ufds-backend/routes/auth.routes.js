import express from "express";
import rateLimit from "express-rate-limit";
import {
  google, googleCallback, login, logout, logoutAll, me, refresh, register,
  revokeSession, sessions,
} from "../controllers/auth.controller.js";
import { requireAuth, requireSameOrigin } from "../middleware/auth.js";
import { loginSchema, registerSchema, validate } from "../middleware/validation.js";

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/google", google);
router.get("/google/callback", googleCallback);
router.post("/refresh", requireSameOrigin, refresh);
router.post("/logout", requireSameOrigin, logout);
router.post("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, me);
router.get("/sessions", requireAuth, sessions);
router.delete("/sessions/:sessionId", requireAuth, revokeSession);

export default router;
