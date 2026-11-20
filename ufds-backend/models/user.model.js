import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, select: false },
  googleId: { type: String, unique: true, sparse: true, select: false },
  avatar: { type: String, default: null },
  emailVerified: { type: Boolean, default: false },
  authProviders: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
