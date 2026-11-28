import express from "express";
import rateLimit from "express-rate-limit";
import { shareDownload, shareInfo } from "../controllers/share.controller.js";

const publicShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
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
router.get("/:token/info", publicShareLimiter, shareInfo);
router.get("/:token/download", publicShareLimiter, shareDownload);
router.post("/:token/download", publicShareLimiter, shareDownload);

export default router;
