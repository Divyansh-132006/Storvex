import mongoose from "mongoose";

const shareLinkSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
      match: /^[a-f0-9]{64}$/,
    },
    createdAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date, required: true },
    maxDownloads: { type: Number, min: 1, max: 1000 },
    downloadCount: { type: Number, min: 0, default: 0 },
    revokedAt: { type: Date, default: null },
    passwordHash: { type: String, select: false },
    lastAccessedAt: { type: Date, default: null },
  },
  { versionKey: false },
);

shareLinkSchema.index({ ownerId: 1, createdAt: -1 });
shareLinkSchema.index({ fileId: 1 });
shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model("ShareLink", shareLinkSchema, "sharelinks");
