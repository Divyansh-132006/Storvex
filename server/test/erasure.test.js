import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { assembleGroup } from "../src/erasure/groupAssembler.js";
import { layoutForGroup } from "../src/erasure/layout.js";
import { reconstructGroup } from "../src/erasure/reconstruct.js";
import { rebuildMissingShard, xorBuffers } from "../src/erasure/xorParity.js";

test("XOR rebuilds every one of five shards", () => {
  const data = Array.from({ length: 4 }, () => crypto.randomBytes(64));
  const shards = [...data, xorBuffers(data)];
  for (let missing = 0; missing < 5; missing += 1) {
    const available = shards.slice();
    available[missing] = null;
    available[missing] = rebuildMissingShard(available, missing);
    assert.deepEqual(available[missing], shards[missing]);
  }
});

test("layout rotates parity and uses every provider position", () => {
  for (let group = 0; group < 10; group += 1) {
    const layout = layoutForGroup(group);
    assert.equal(layout.filter((entry) => entry.role === "parity").length, 1);
    assert.deepEqual(layout.map((entry) => entry.position), [0, 1, 2, 3, 4]);
    assert.equal(layout[group % 5].role, "parity");
  }
});

test("groups reconstruct in data order", () => {
  const blocks = Array.from({ length: 4 }, (_, index) => Buffer.alloc(8, index + 1));
  const group = assembleGroup(blocks, 2, 8);
  const slots = group.map((shard) => shard.bytes);
  slots[1] = null;
  assert.deepEqual(reconstructGroup(slots, 2), blocks);
});
