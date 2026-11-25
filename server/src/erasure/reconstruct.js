import { rebuildMissingShard } from "./xorParity.js";
import { layoutForGroup } from "./layout.js";

export function reconstructGroup(shards, groupNo) {
  if (!Array.isArray(shards) || shards.length !== 5) throw new Error("Five shard slots are required");
  const missing = shards.map((shard, index) => (shard ? -1 : index)).filter((index) => index >= 0);
  if (missing.length > 1) throw new Error("Group is unrecoverable");
  const complete = missing.length ? shards.slice() : shards;
  if (missing.length) complete[missing[0]] = rebuildMissingShard(complete, missing[0]);
  const byDataIndex = new Map(
    layoutForGroup(groupNo)
      .filter((entry) => entry.role === "data")
      .map((entry) => [entry.dataIndex, complete[entry.position]]),
  );
  return [0, 1, 2, 3].map((index) => byDataIndex.get(index));
}
