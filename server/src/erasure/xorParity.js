export function xorBuffers(buffers) {
  if (!buffers.length) throw new Error("At least one shard is required");
  const size = buffers[0].length;
  if (buffers.some((buffer) => buffer.length !== size)) {
    throw new Error("All shards must have the same size");
  }
  const result = Buffer.alloc(size);
  for (const buffer of buffers) {
    for (let index = 0; index < size; index += 1) result[index] ^= buffer[index];
  }
  return result;
}

export function rebuildMissingShard(shards, missingIndex) {
  if (!Number.isInteger(missingIndex) || missingIndex < 0 || missingIndex >= shards.length) {
    throw new Error("Invalid missing shard index");
  }
  const available = shards.filter((shard, index) => index !== missingIndex);
  if (available.some((shard) => !Buffer.isBuffer(shard))) {
    throw new Error("Four valid shards are required for recovery");
  }
  return xorBuffers(available);
}
