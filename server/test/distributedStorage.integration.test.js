import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createServer, request as httpRequest } from "node:http";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, beforeEach, test } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";

const shardSize = 1024 * 1024;
const masterKey = Buffer.alloc(32, 0x31);
const plainMarker = "UFDS_PLAINTEXT_MARKER_4f83e2";
const plainFilename = "plaintext-filename-marker.txt";
const userId = () => new mongoose.Types.ObjectId().toString();
let requestCount = 0;

let mongod;
let mongoose;
let app;
let providers;
let File;
let Shard;
let Event;
let config;
let signAccessToken;
let LocalDiskAdapter;
let encryptMetadata;
let deriveFileKey;
let deriveMetaKey;
let createEncryptStream;
let server;
let baseUrl;
let storageDir;

function token(id) {
  return signAccessToken({ id, role: "user" });
}

function authHeaders(id) {
  const requestId = requestCount++;
  const ip = `198.18.${Math.floor(requestId / 254)}.${(requestId % 254) + 1}`;
  return { Authorization: `Bearer ${token(id)}`, "X-Forwarded-For": ip };
}

async function upload(data, { as = userId(), filename = "sample.bin" } = {}) {
  const form = new FormData();
  form.append("file", new Blob([data]), filename);
  const response = await fetch(`${baseUrl}/api/files/upload`, {
    method: "POST",
    headers: authHeaders(as),
    body: form,
  });
  const body = await response.json();
  return { response, body, as };
}

async function downloaded(id, as) {
  const response = await fetch(`${baseUrl}/api/files/${id}/download`, {
    headers: authHeaders(as),
  });
  return { response, bytes: Buffer.from(await response.arrayBuffer()) };
}

async function storedProviderFiles() {
  const counts = [];
  for (let index = 0; index < 5; index += 1) {
    const files = await mongoose.connection.db
      .collection(`provider${index + 1}.files`)
      .find({})
      .toArray();
    counts.push(files);
  }
  return counts;
}

async function clearDatabase() {
  await Promise.all([
    File.deleteMany({}),
    Shard.deleteMany({}),
    Event.deleteMany({}),
  ]);
  for (let index = 0; index < 5; index += 1) {
    await Promise.all([
      mongoose.connection.db
        .collection(`provider${index + 1}.files`)
        .deleteMany({}),
      mongoose.connection.db
        .collection(`provider${index + 1}.chunks`)
        .deleteMany({}),
    ]);
  }
  for (const provider of providers) {
    provider.setMode("none");
    provider.adapter.downUntil = 0;
    provider.adapter.failureCount = 0;
    provider.adapter.lastError = null;
  }
}

before(async () => {
  storageDir = await import("node:fs/promises").then(({ mkdtemp }) =>
    mkdtemp(path.join(os.tmpdir(), "storvex-distribution-test-")),
  );
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri("storvex-integration");
  Object.assign(process.env, {
    NODE_ENV: "test",
    MONGODB_URI: uri,
    JWT_ACCESS_SECRET: "integration-test-secret",
    GOOGLE_CLIENT_ID: "integration-test-client",
    MASTER_KEY_V1: masterKey.toString("base64"),
    CURRENT_KEY_VERSION: "1",
    SHARD_SIZE_BYTES: String(shardSize),
    UNIT_SIZE_BYTES: String(shardSize),
    STORAGE_DIR: storageDir,
    ENABLE_FAULT_INJECTION: "true",
    PROVIDER_1_TYPE: "gridfs",
    PROVIDER_2_TYPE: "gridfs",
    PROVIDER_3_TYPE: "gridfs",
    PROVIDER_4_TYPE: "gridfs",
    PROVIDER_5_TYPE: "gridfs",
    PROVIDER_MAX_RETRIES: "0",
    PROVIDER_TIMEOUT_MS: "30000",
    VERIFY_READBACK: "false",
    MAX_FILE_SIZE_MB: "100",
    MAX_USER_STORAGE_MB: "1024",
  });

  mongoose = (await import("mongoose")).default;
  ({ default: app } = await import("../src/app.js"));
  ({ default: providers } = await import("../src/providers/registry.js"));
  ({ default: File } = await import("../src/models/File.js"));
  ({ default: Shard } = await import("../src/models/Shard.js"));
  ({ default: Event } = await import("../src/models/Event.js"));
  ({ config } = await import("../src/config/env.js"));
  ({ signAccessToken } = await import("../src/utils/tokens.js"));
  ({ default: LocalDiskAdapter } = await import("../src/storage/LocalDiskAdapter.js"));
  ({ encryptMetadata } = await import("../src/crypto/metaCipher.js"));
  ({ deriveFileKey, deriveMetaKey } = await import("../src/crypto/keyService.js"));
  ({ createEncryptStream } = await import("../src/crypto/unitCipher.js"));

  await mongoose.connect(uri);
  await Promise.all([File.init(), Shard.init(), Event.init()]);
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(clearDatabase);

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (providers) {
    await Promise.all(providers.map((provider) => provider.adapter.connection.close()));
  }
  if (mongoose) await mongoose.disconnect();
  if (mongod) await mongod.stop();
  if (storageDir) {
    const { rm } = await import("node:fs/promises");
    await rm(storageDir, { recursive: true, force: true });
  }
});

test("round trips all requested sizes byte-for-byte", async () => {
  for (const size of [0, 1, shardSize, 4 * shardSize, 4 * shardSize + 1, 25 * 1024 * 1024]) {
    const original = crypto.randomBytes(size);
    const { response, body, as } = await upload(original);
    assert.equal(response.status, 201, `upload of ${size} bytes`);
    const result = await downloaded(body.file.id, as);
    assert.equal(result.response.status, 200, `download of ${size} bytes`);
    assert.deepEqual(result.bytes, original, `round trip of ${size} bytes`);
  }
});

test("persists exactly five full-size shards for every group", async () => {
  const { response, body } = await upload(crypto.randomBytes(5 * shardSize + 3));
  assert.equal(response.status, 201);
  const file = await File.findById(body.file.id).lean();
  const shards = await Shard.find({ fileId: file._id }).lean();
  const filesByProvider = await storedProviderFiles();
  const storedBytes = filesByProvider.flat().reduce((sum, item) => sum + item.length, 0);

  assert.equal(shards.length, file.groupCount * 5);
  assert.ok(shards.every((shard) => shard.status === "verified" && shard.size === file.shardSize));
  assert.equal(storedBytes, file.groupCount * 5 * file.shardSize);
});

test("downloads successfully with each individual provider offline", async () => {
  const original = crypto.randomBytes(3 * shardSize);
  const { body, as } = await upload(original);
  for (const provider of providers) {
    provider.setMode("offline");
    try {
      const result = await downloaded(body.file.id, as);
      assert.equal(result.response.status, 200, `provider ${provider.adapter.index}`);
      assert.deepEqual(result.bytes, original, `provider ${provider.adapter.index}`);
    } finally {
      provider.setMode("none");
      await Shard.updateMany(
        { fileId: body.file.id, providerIndex: provider.adapter.index, status: "missing" },
        { $set: { status: "verified" } },
      );
    }
  }
});

test("rejects a bad shard by SHA-256, marks it corrupt, and repairs it", async () => {
  const original = crypto.randomBytes(shardSize + 50);
  const { body, as } = await upload(original);
  const shard = await Shard.findOne({ fileId: body.file.id, groupNo: 0, role: "data" }).lean();
  const provider = providers[shard.position].adapter;
  const damaged = Buffer.from(await provider.getObject(shard.objectKey));
  damaged[0] ^= 0x80;
  await provider.deleteObject(shard.objectKey);
  await provider.putObject(shard.objectKey, damaged);

  const result = await downloaded(body.file.id, as);
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.bytes, original);
  assert.equal((await Shard.findById(shard._id)).status, "corrupt");

  const { repairShards } = await import("../src/services/repair.service.js");
  assert.deepEqual(await repairShards(), { repaired: 1 });
  assert.equal((await Shard.findById(shard._id)).status, "verified");
  assert.deepEqual((await downloaded(body.file.id, as)).bytes, original);
});

test("fails before sending plaintext when two shards in one group are unusable", async () => {
  const original = Buffer.from(plainMarker.repeat(shardSize / plainMarker.length));
  const { body, as } = await upload(original);
  await Shard.updateMany(
    { fileId: body.file.id, groupNo: 0, position: { $in: [0, 1] } },
    { $set: { status: "missing" } },
  );

  const result = await downloaded(body.file.id, as);
  assert.equal(result.response.status, 503);
  assert.equal(result.bytes.includes(Buffer.from(plainMarker)), false);
});

test("recovers one damaged shard in each of two different groups", async () => {
  const original = crypto.randomBytes(9 * shardSize);
  const { body, as } = await upload(original);
  const targets = await Promise.all([0, 1].map((groupNo) =>
    Shard.findOne({ fileId: body.file.id, groupNo, role: "data" }).lean(),
  ));
  assert.equal(targets.length, 2);

  for (const shard of targets) {
    const provider = providers[shard.position].adapter;
    const damaged = Buffer.from(await provider.getObject(shard.objectKey));
    damaged[0] ^= 1;
    await provider.deleteObject(shard.objectKey);
    await provider.putObject(shard.objectKey, damaged);
  }

  const result = await downloaded(body.file.id, as);
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.bytes, original);
  const updated = await Shard.find({ _id: { $in: targets.map((shard) => shard._id) } }).lean();
  assert.ok(updated.every((shard) => shard.status === "corrupt"));
});

test("Poly1305 rejects data even when its stored SHA-256 is changed to match", async () => {
  const original = Buffer.from(plainMarker.repeat(Math.ceil((3 * shardSize) / plainMarker.length))).subarray(0, 3 * shardSize);
  const { body, as } = await upload(original);
  const shard = await Shard.findOne({
    fileId: body.file.id,
    groupNo: 0,
    role: "data",
    dataIndex: 2,
  }).lean();
  const provider = providers[shard.position].adapter;
  const damaged = Buffer.from(await provider.getObject(shard.objectKey));
  damaged[0] ^= 1;
  await provider.deleteObject(shard.objectKey);
  await provider.putObject(shard.objectKey, damaged);
  await Shard.updateOne(
    { _id: shard._id },
    { $set: { sha256: crypto.createHash("sha256").update(damaged).digest("hex") } },
  );

  const result = await downloaded(body.file.id, as);
  assert.equal(result.response.status, 500);
  assert.equal(result.bytes.includes(Buffer.from(plainMarker)), false);
});

test("cleans all shards and marks the file failed after a mid-upload provider failure", async () => {
  const failingProvider = providers[2];
  const adapter = failingProvider.adapter;
  const originalPut = adapter.putObject.bind(adapter);
  let puts = 0;
  adapter.putObject = async (...args) => {
    puts += 1;
    if (puts === 2) throw new Error("Injected mid-upload failure");
    return originalPut(...args);
  };
  const as = userId();
  let result;
  try {
    result = await upload(crypto.randomBytes(6 * shardSize), { as });
  } finally {
    adapter.putObject = originalPut;
  }

  assert.equal(result.response.status, 500, JSON.stringify(result.body));
  const file = await File.findOne({ user_id: as }).lean();
  assert.equal(file.status, "failed");
  assert.equal(await Shard.countDocuments({ fileId: file._id }), 0);
  assert.equal((await storedProviderFiles()).flat().length, 0);
});

test("client abort during upload leaves no pending file or orphan shards", async () => {
  const as = userId();
  const boundary = "abort-test-boundary";
  const request = httpRequest(`${baseUrl}/api/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token(as)}`,
      "X-Forwarded-For": "198.18.255.1",
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
  });
  request.on("error", () => {});
  request.write(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="aborted.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`,
  );
  for (let index = 0; index < 256; index += 1) {
    if (request.destroyed) break;
    request.write(Buffer.alloc(32 * 1024, index));
    await delay(2);
  }
  let uploadedShards = 0;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    uploadedShards = await Shard.countDocuments({ userId: as });
    if (uploadedShards >= 5) break;
    await delay(100);
  }
  assert.ok(uploadedShards >= 5, "the abort should occur after a shard group has been stored");
  request.destroy();

  let files = [];
  for (let attempt = 0; attempt < 50; attempt += 1) {
    files = await File.find({ user_id: as }).lean();
    if (files.length === 1 && files[0].status !== "pending") break;
    await delay(100);
  }
  assert.equal(files.length, 1);
  assert.equal(files[0].status, "failed");
  assert.equal(await Shard.countDocuments({ userId: as }), 0);
  assert.equal((await storedProviderFiles()).flat().length, 0);
});

test("another user gets 404 and unauthenticated callers get 401 for download, health, and delete", async () => {
  const { body } = await upload(Buffer.from("owner only"));
  const other = userId();
  for (const [method, suffix] of [
    ["GET", "/download"],
    ["GET", "/health"],
    ["DELETE", ""],
  ]) {
    const url = `${baseUrl}/api/files/${body.file.id}${suffix}`;
    const forbidden = await fetch(url, { method, headers: authHeaders(other) });
    assert.equal(forbidden.status, 404, `${method} ${suffix}`);
    const unauthenticated = await fetch(url, { method, headers: { "X-Forwarded-For": `198.18.254.${requestCount++ % 254 + 1}` } });
    assert.equal(unauthenticated.status, 401, `${method} ${suffix}`);
  }
});

test("legacy single-storage files remain downloadable", async () => {
  const id = new mongoose.Types.ObjectId();
  const as = userId();
  const salt = crypto.randomBytes(32);
  const keyVersion = config.currentKeyVersion;
  const original = Buffer.from("legacy single-storage file");
  const encrypted = [];
  const { Readable } = await import("node:stream");
  const { pipeline } = await import("node:stream/promises");
  await pipeline(
    Readable.from([original]),
    createEncryptStream({ key: deriveFileKey(id, salt, keyVersion), fileId: id }),
    async function* (source) {
      for await (const chunk of source) encrypted.push(chunk);
    },
  );
  const ciphertext = Buffer.concat(encrypted);
  const storageKey = crypto.randomBytes(32).toString("hex");
  const storage = new LocalDiskAdapter(storageDir);
  await storage.putStream(storageKey, Readable.from([ciphertext]));
  await File.create({
    _id: id,
    user_id: as,
    status: "committed",
    storageMode: "single",
    originalSize: original.length,
    unitSize: config.unitSize,
    unitCount: 1,
    ciphertextSize: ciphertext.length,
    encryption: {
      algo: "chacha20-poly1305",
      keyVersion,
      fileSalt: salt.toString("base64"),
    },
    metaEnc: encryptMetadata(
      { name: "legacy.txt", mime: "text/plain" },
      deriveMetaKey(id, salt, keyVersion),
      id,
    ),
    ciphertextSha256: crypto.createHash("sha256").update(ciphertext).digest("hex"),
    storageKey,
  });

  const result = await downloaded(String(id), as);
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.bytes, original);
});

test("repair worker is idempotent across repeated runs", async () => {
  const { body } = await upload(crypto.randomBytes(shardSize));
  const shard = await Shard.findOne({ fileId: body.file.id, role: "data" }).lean();
  await Shard.updateOne({ _id: shard._id }, { $set: { status: "missing" } });
  const { repairShards } = await import("../src/services/repair.service.js");

  assert.deepEqual(await repairShards(), { repaired: 1 });
  assert.deepEqual(await repairShards(), { repaired: 0 });
  assert.equal((await Shard.findById(shard._id)).status, "verified");
});

test("MongoDB documents contain no master key, plaintext filename, or marker", async () => {
  const payload = Buffer.from(`prefix:${plainMarker}:suffix`);
  const { response } = await upload(payload, { filename: plainFilename });
  assert.equal(response.status, 201);

  const names = [plainMarker, plainFilename, masterKey.toString("hex"), masterKey.toString("base64")];
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const collection of collections) {
    const documents = await mongoose.connection.db.collection(collection.name).find({}).toArray();
    const serialized = JSON.stringify(documents);
    for (const name of names) assert.equal(serialized.includes(name), false, `${collection.name} contains ${name}`);
  }
});

test("stored provider shard bytes do not contain the plaintext marker", async () => {
  const marker = Buffer.from(plainMarker);
  const { response, body } = await upload(Buffer.from(`before-${plainMarker}-after`), { filename: plainFilename });
  assert.equal(response.status, 201);
  const shards = await Shard.find({ fileId: body.file.id }).lean();
  for (const shard of shards) {
    const bytes = await providers[shard.position].adapter.getObject(shard.objectKey);
    assert.equal(bytes.includes(marker), false, `provider ${shard.position}, group ${shard.groupNo}`);
  }
});
