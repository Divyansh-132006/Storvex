import { config } from "./config/env.js";
import app from "./app.js";
import { connectDatabase } from "./db/mongoose.js";

connectDatabase()
  .then(() => app.listen(config.port, () => {
    console.log(`Storvex backend running on port ${config.port}`);
  }))
  .catch((error) => {
    console.error("Unable to connect to MongoDB", error.message);
    process.exitCode = 1;
  });