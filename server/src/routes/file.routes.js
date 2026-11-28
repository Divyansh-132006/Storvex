import express from "express";
import { requireInternalService } from "../middleware/internalService.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { refreshLimiter } from "../middleware/rateLimit.middleware.js";
import {
  download,
  list,
  remove,
  upload,
  health,
} from "../controllers/file.controller.js";
import {
  create as createShare,
  list as listShares,
} from "../controllers/share.controller.js";

const router = express.Router();
router.use(requireInternalService, requireAuth);
router.post("/upload", refreshLimiter, upload);
router.get("/", list);
router.get("/:id/health", health);
router.post("/:id/shares", createShare);
router.get("/:id/shares", listShares);
router.get("/:id/download", refreshLimiter, download);
router.delete("/:id", refreshLimiter, remove);
export default router;
