import { Router } from "express";
import {
  googleLogin,
  login,
  logout,
  me,
  refresh,
  signup,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  refreshLimiter,
  strictAuthLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  googleSchema,
  loginSchema,
  signupSchema,
} from "../validators/auth.validators.js";

const router = Router();

router.post("/signup", strictAuthLimiter, validate(signupSchema), signup);
router.post("/login", strictAuthLimiter, validate(loginSchema), login);
router.post("/google", strictAuthLimiter, validate(googleSchema), googleLogin);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
