import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { config } from "./config/env.js";
import ShareLink from "./models/ShareLink.js";
import { ensureFileIndexes } from "./services/fileIndexMigration.service.js";
import { migrateDistributedFileMetadata } from "./services/fileMetadataMigration.service.js";
import { startRepairWorker } from "./workers/repairWorker.js";

async function start() {
  await connectDatabase();
  await ensureFileIndexes();
  await ShareLink.init();
  const migratedFiles = await migrateDistributedFileMetadata();
  if (migratedFiles > 0) {
    console.info(`Migrated ${migratedFiles} distributed file metadata records`);
  }
  app.listen(config.port, () => {
    console.log(`UFDS server listening on port ${config.port}`);
    startRepairWorker();
  });
}

start().catch((error) => {
  console.error("Server startup failed");
  process.exit(1);
});
