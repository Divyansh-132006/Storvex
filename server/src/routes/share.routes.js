import express from "express";
import rateLimit from "express-rate-limit";
import { requireInternalService } from "../middleware/internalService.middleware.js";
import { download, info } from "../controllers/share.controller.js";

const publicShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.get("x-internal-client-ip") || req.ip,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const router = express.Router();
router.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
  });
  next();
});
router.use(requireInternalService);
router.get("/:token/info", publicShareLimiter, info);
router.get("/:token/download", publicShareLimiter, download);
router.post("/:token/download", publicShareLimiter, download);

export default router;
