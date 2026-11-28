import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { revokeShare } from "../controllers/share.controller.js";

const router = express.Router();
router.use(requireAuth);
router.delete("/:shareId", revokeShare);

export default router;
