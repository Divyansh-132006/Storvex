import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  deleteFile,
  downloadFile,
  listFiles,
  uploadFile,
} from "../controllers/file.controller.js";

const router = express.Router();

router.use(requireAuth);
router.post("/upload", uploadFile);
router.get("/", listFiles);
router.get("/:id/download", downloadFile);
router.delete("/:id", deleteFile);

export default router;
