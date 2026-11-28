import express from "express";
import { requireInternalService } from "../middleware/internalService.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { revoke } from "../controllers/share.controller.js";

const router = express.Router();
router.use(requireInternalService, requireAuth);
router.delete("/:shareId", revoke);

export default router;
