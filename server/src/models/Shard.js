import mongoose from "mongoose";

const shardSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    groupNo: { type: Number, min: 0, required: true },
    position: { type: Number, min: 0, max: 4, required: true },
    role: { type: String, enum: ["data", "parity"], required: true },
    dataIndex: { type: Number, min: 0, max: 3, default: null },
    objectKey: { type: String, required: true, unique: true },
    size: { type: Number, required: true },
    sha256: { type: String, match: /^[a-f0-9]{64}$/, required: true },
    status: { type: String, enum: ["pending", "stored", "verified", "missing", "corrupt"], default: "pending" },
    providerIndex: { type: Number, min: 0, max: 4, required: true },
    createdAt: { type: Date, default: Date.now },
    lastVerifiedAt: { type: Date, default: null },
  },
  { versionKey: false },
);

shardSchema.index({ fileId: 1, groupNo: 1, position: 1 }, { unique: true });
shardSchema.index({ fileId: 1, groupNo: 1 });
shardSchema.index({ providerIndex: 1, status: 1 });
export default mongoose.model("Shard", shardSchema);
