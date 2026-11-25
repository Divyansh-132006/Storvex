import { xorBuffers } from "./xorParity.js";
import { layoutForGroup } from "./layout.js";

export function assembleGroup(blocks, groupNo, shardSize) {
  if (!Array.isArray(blocks) || blocks.length < 1 || blocks.length > 4) {
    throw new Error("A group must contain one to four blocks");
  }
  const data = blocks.concat(
    Array.from({ length: 4 - blocks.length }, () => Buffer.alloc(shardSize)),
  );
  if (data.some((block) => block.length !== shardSize)) throw new Error("Invalid block size");
  const parity = xorBuffers(data);
  return layoutForGroup(groupNo).map((entry) => ({
    ...entry,
    bytes: entry.role === "parity" ? parity : data[entry.dataIndex],
  }));
}
