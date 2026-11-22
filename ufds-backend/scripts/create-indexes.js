import { connectDatabase, disconnectDatabase } from "../db/mongoose.js";
import User from "../models/user.model.js";
import RefreshToken from "../models/refresh-token.model.js";
import File from "../models/file.model.js";

try {
  await connectDatabase();
  await User.createIndexes();
  await RefreshToken.createIndexes();
  await File.createIndexes();
  console.log("MongoDB indexes created");
} finally {
  await disconnectDatabase();
}
