import { connectDatabase, disconnectDatabase } from "../db/mongoose.js";
import User from "../models/user.model.js";
import RefreshToken from "../models/refresh-token.model.js";

try {
  await connectDatabase();
  await User.createIndexes();
  await RefreshToken.createIndexes();
  console.log("MongoDB indexes created");
} finally {
  await disconnectDatabase();
}
