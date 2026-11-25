import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "uploaded", "verified", "committed", "failed"],
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now, required: true },
    originalSize: { type: Number, min: 0, required: true },
    unitSize: { type: Number, min: 1, required: true },
    unitCount: { type: Number, min: 1, required: true },
    ciphertextSize: { type: Number, min: 0, required: true },
    storageMode: { type: String, enum: ["single", "ec-4+1"], default: "ec-4+1" },
    shardSize: { type: Number, min: 1, default: 1048576 },
    groupCount: { type: Number, min: 0, default: 0 },
    erasure: {
      scheme: { type: String, enum: ["4+1"], default: "4+1" },
    },
    idempotencyKey: { type: String, sparse: true },
    encryption: {
      algo: { type: String, enum: ["chacha20-poly1305"], required: true },
      keyVersion: { type: Number, min: 1, required: true },
      fileSalt: { type: String, required: true },
    },
    metaEnc: { type: String, required: true },
    ciphertextSha256: { type: String, match: /^[a-f0-9]{64}$/, required: true },
    storageKey: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-f0-9]{32,128}$/,
    },
  },
  { versionKey: false },
);

fileSchema.index({ user_id: 1, createdAt: -1 });
fileSchema.index({ user_id: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
export default mongoose.model("File", fileSchema);
