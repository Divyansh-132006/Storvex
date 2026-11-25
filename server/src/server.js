import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { config } from "./config/env.js";
import { startRepairWorker } from "./workers/repairWorker.js";

async function start() {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`UFDS server listening on port ${config.port}`);
    startRepairWorker();
  });
}

start().catch((error) => {
  console.error("Server startup failed");
  process.exit(1);
});
