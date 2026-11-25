import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import providers from "../providers/registry.js";
import { config } from "../config/env.js";
import { runRepairPass } from "../workers/repairWorker.js";
import Shard from "../models/Shard.js";
import ApiError from "../utils/ApiError.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/providers", async (req, res, next) => {
  try {
    const counts = await Shard.aggregate([{ $group: { _id: "$providerIndex", count: { $sum: 1 } } }]);
    res.json({ success: true, providers: providers.map((provider, index) => ({ ...provider.health(), shardCount: counts.find((item) => item._id === index)?.count || 0 })) });
  } catch (error) { next(error); }
});

router.post("/providers/:index/fault", async (req, res, next) => {
  try {
    if (!config.enableFaultInjection) throw new ApiError(404, "Fault injection is disabled");
    const index = Number(req.params.index);
    if (!providers[index]) throw new ApiError(400, "Invalid provider");
    providers[index].setMode(req.body?.mode);
    res.json({ success: true, provider: providers[index].health() });
  } catch (error) { next(error); }
});

router.post("/repair/run", async (req, res, next) => {
  try { res.json({ success: true, counts: await runRepairPass() }); } catch (error) { next(error); }
});

export default router;
