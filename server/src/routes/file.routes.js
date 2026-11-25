import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { refreshLimiter } from "../middleware/rateLimit.middleware.js";
import {
  download,
  list,
  remove,
  upload,
  health,
} from "../controllers/file.controller.js";

const router = express.Router();
router.use(requireAuth);
router.post("/upload", refreshLimiter, upload);
router.get("/", list);
router.get("/:id/health", health);
router.get("/:id/download", refreshLimiter, download);
router.delete("/:id", refreshLimiter, remove);
export default router;
