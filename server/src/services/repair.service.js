import crypto from "node:crypto";
import File from "../models/File.js";
import Shard from "../models/Shard.js";
import Event from "../models/Event.js";
import providers from "../providers/registry.js";
import { reconstructGroup } from "../erasure/reconstruct.js";
import { xorBuffers } from "../erasure/xorParity.js";
import { config } from "../config/env.js";

const digest = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

export async function repairShards() {
  const targets = await Shard.find({ status: { $in: ["missing", "corrupt"] } }).limit(100);
  let repaired = 0;
  for (const target of targets) {
    const siblings = await Shard.find({ fileId: target.fileId, groupNo: target.groupNo }).lean();
    const slots = Array(5).fill(null);
    await Promise.all(siblings.filter((shard) => shard._id.toString() !== target._id.toString()).map(async (shard) => {
      try {
        const bytes = await providers[shard.position].getObject(shard.objectKey);
        if (bytes.length === shard.size && digest(bytes) === shard.sha256) slots[shard.position] = bytes;
      } catch {
        // A provider can remain unavailable; the group is retried on the next pass.
      }
    }));
    if (slots.filter(Boolean).length !== 4) continue;
    const rebuilt = reconstructGroup(slots.map((slot, position) => position === target.position ? null : slot), target.groupNo);
    const replacement = target.role === "parity"
      ? xorBuffers(rebuilt)
      : rebuilt[target.dataIndex];
    const objectKey = crypto.randomBytes(24).toString("hex");
    await providers[target.position].putObject(objectKey, replacement);
    await Shard.updateOne(
      { _id: target._id, status: { $in: ["missing", "corrupt"] } },
      { $set: { objectKey, sha256: digest(replacement), status: "verified", lastVerifiedAt: new Date() } },
    );
    repaired += 1;
    await Event.create({ fileId: target.fileId, userId: target.userId, type: "shard_repaired", details: { groups: 1, shards: 1, providers: 1 } });
  }
  return { repaired };
}

export async function reconcileFiles() {
  const cutoff = new Date(Date.now() - config.pendingTimeoutMinutes * 60 * 1000);
  const files = await File.find({ status: { $in: ["pending", "uploaded"] }, createdAt: { $lt: cutoff } }).select("_id");
  if (files.length) {
    await Shard.deleteMany({ fileId: { $in: files.map((file) => file._id) } });
    await File.updateMany({ _id: { $in: files.map((file) => file._id) } }, { $set: { status: "failed" } });
  }
  return { failed: files.length };
}
