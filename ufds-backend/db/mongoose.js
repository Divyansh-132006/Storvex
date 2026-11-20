import mongoose from "mongoose";
import { config } from "../config/env.js";

export const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 8000 });
  } catch (error) {
    const localMongoUri = "mongodb://127.0.0.1:27017/ufds";
    if (config.mongodbUri === localMongoUri) throw error;

    console.warn("Configured MongoDB is unavailable; using local MongoDB fallback");
    await mongoose.connect(localMongoUri, { serverSelectionTimeoutMS: 5000 });
  }
  console.log("MongoDB connected");
};

export const disconnectDatabase = () => mongoose.disconnect();
