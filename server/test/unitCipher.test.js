import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import test from "node:test";

process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/ufds-test";
process.env.JWT_ACCESS_SECRET = "test-secret";
process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.MASTER_KEY_V1 = Buffer.alloc(32, 1).toString("base64");

const { createDecryptStream, createEncryptStream } = await import(
  "../src/crypto/unitCipher.js"
);

async function encrypt(input) {
  const chunks = [];
  await pipeline(
    Readable.from([input]),
    createEncryptStream({
      key: Buffer.alloc(32, 7),
      fileId: "507f1f77bcf86cd799439011",
    }),
    async function* (source) {
      for await (const chunk of source) chunks.push(chunk);
    },
  );
  return Buffer.concat(chunks);
}

async function decrypt(input, unitCount) {
  const chunks = [];
  await pipeline(
    Readable.from([input]),
    createDecryptStream({
      key: Buffer.alloc(32, 7),
      fileId: "507f1f77bcf86cd799439011",
      unitCount,
    }),
    async function* (source) {
      for await (const chunk of source) chunks.push(chunk);
    },
  );
  return Buffer.concat(chunks);
}

test("round trips empty, boundary, and multi-unit files", async () => {
  for (const size of [0, 1, 1048576, 1048577, 2500000]) {
    const input = Buffer.alloc(size, 65);
    const encrypted = await encrypt(input);
    assert.deepEqual(
      await decrypt(encrypted, Math.max(1, Math.ceil(size / 1048576))),
      input,
    );
  }
});

test("rejects a tampered encrypted unit", async () => {
  const encrypted = await encrypt(Buffer.from("known marker"));
  encrypted[0] ^= 1;
  await assert.rejects(decrypt(encrypted, 1));
});
