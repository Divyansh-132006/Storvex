import File from "../models/File.js";

function isIdempotencyIndex(index) {
  const keys = Object.entries(index.key || {});
  return keys.length === 2
    && keys[0][0] === "user_id"
    && keys[0][1] === 1
    && keys[1][0] === "idempotencyKey"
    && keys[1][1] === 1;
}

function hasExpectedPartialFilter(index) {
  const filter = index.partialFilterExpression;
  const idempotencyKeyFilter = filter?.idempotencyKey;
  return Object.keys(filter || {}).length === 1
    && Object.keys(idempotencyKeyFilter || {}).length === 1
    && idempotencyKeyFilter.$type === "string";
}

export async function ensureFileIndexes() {
  let indexes = [];
  try {
    indexes = await File.collection.indexes();
  } catch (error) {
    if (error.code !== 26 && error.codeName !== "NamespaceNotFound") throw error;
  }

  for (const index of indexes) {
    if (isIdempotencyIndex(index) && (!index.unique || !hasExpectedPartialFilter(index))) {
      await File.collection.dropIndex(index.name);
    }
  }

  await File.createIndexes();
  await File.updateMany(
    { status: "failed", idempotencyKey: { $type: "string" } },
    { $unset: { idempotencyKey: 1 } },
  );
}
