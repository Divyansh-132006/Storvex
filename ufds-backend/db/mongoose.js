import mongoose from "mongoose";
import { config } from "../config/env.js";

export const connectDatabase = async () => {
  await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 8000 });
  console.log("MongoDB connected");
};

export const disconnectDatabase = () => mongoose.disconnect();
