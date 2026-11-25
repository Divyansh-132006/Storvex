import { Transform } from "node:stream";

export function createBlockSplitter(shardSize) {
  if (!Number.isInteger(shardSize) || shardSize < 1) throw new Error("Invalid shard size");
  let pending = Buffer.alloc(0);
  let emitted = false;
  return new Transform({
    transform(chunk, encoding, callback) {
      pending = Buffer.concat([pending, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding)]);
      while (pending.length >= shardSize) {
        this.push(pending.subarray(0, shardSize));
        pending = pending.subarray(shardSize);
        emitted = true;
      }
      callback();
    },
    flush(callback) {
      if (pending.length || !emitted) {
        this.push(Buffer.concat([pending, Buffer.alloc(shardSize - pending.length)]));
      }
      callback();
    },
  });
}
