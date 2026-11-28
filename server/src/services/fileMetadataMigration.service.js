import File from "../models/File.js";

export async function migrateDistributedFileMetadata() {
  const legacyCollection = File.db.db.collection("files");
  const documents = await legacyCollection
    .find({ user_id: { $exists: true }, storageKey: { $exists: true } })
    .toArray();

  if (documents.length === 0) return 0;

  const result = await File.collection.bulkWrite(
    documents.map((document) => ({
      updateOne: {
        filter: { _id: document._id },
        update: { $setOnInsert: document },
        upsert: true,
      },
    })),
    { ordered: true },
  );
  return result.upsertedCount;
}
