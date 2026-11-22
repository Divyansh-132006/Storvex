import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true, maxlength: 255 },
  mimeType: { type: String, required: true, maxlength: 200 },
  size: { type: Number, required: true, min: 0 },
  gridFsId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  status: {
    type: String,
    enum: ["uploaded"],
    default: "uploaded",
    required: true,
  },
}, { timestamps: true });

fileSchema.index({ ownerId: 1, createdAt: -1 });

export default mongoose.model("File", fileSchema);
