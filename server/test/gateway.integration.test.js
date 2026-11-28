import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { after, before, test } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";

const masterKey = Buffer.alloc(32, 0x42);
const accessSecret = "gateway-integration-test-secret";
const internalServiceToken = "gateway-integration-service-token";
const distributedBytes = crypto.randomBytes(1024 * 1024 + 19);
const legacyBytes = Buffer.from("legacy-gridfs-file-through-gateway");
const userId = () => new gatewayMongoose.Types.ObjectId().toString();

let mongod;
let gatewayMongoose;
let storageMongoose;
let gatewayApp;
let storageApp;
let gatewayUserModel;
let gatewayFileModel;
let gatewayConfig;
let storageFileModel;
let storageShardModel;
let storageEventModel;
let providers;
let signAccessToken;
let storageServer;
let gatewayServer;
let gatewayUrl;

function headersFor(token) {
  return {
    Authorization: `Bearer ${token}`,
    "X-Internal-Service-Token": internalServiceToken,
  };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri("storvex-gateway-integration");
  Object.assign(process.env, {
    NODE_ENV: "test",
    MONGODB_URI: mongoUri,
    JWT_ACCESS_SECRET: accessSecret,
    INTERNAL_SERVICE_TOKEN: internalServiceToken,
    GOOGLE_CLIENT_ID: "gateway-integration-client",
    MASTER_KEY_V1: masterKey.toString("base64"),
    CURRENT_KEY_VERSION: "1",
    SHARD_SIZE_BYTES: "1048576",
    UNIT_SIZE_BYTES: "1048576",
    STORAGE_DIR: "./storage/gateway-integration-test",
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
    CLIENT_URL: "http://localhost:5173",
  });

  storageMongoose = (await import("mongoose")).default;
  await storageMongoose.connect(mongoUri);
  ({ default: storageApp } = await import("../src/app.js"));
  ({ default: providers } = await import("../src/providers/registry.js"));
  ({ default: storageFileModel } = await import("../src/models/File.js"));
  ({ default: storageShardModel } = await import("../src/models/Shard.js"));
  ({ default: storageEventModel } = await import("../src/models/Event.js"));
  await Promise.all([
    storageFileModel.init(),
    storageShardModel.init(),
    storageEventModel.init(),
  ]);
  storageServer = createServer(storageApp);
  await new Promise((resolve) => storageServer.listen(0, "127.0.0.1", resolve));
  process.env.DISTRIBUTED_STORAGE_URL = `http://127.0.0.1:${storageServer.address().port}`;

  ({ default: gatewayApp } = await import("../../ufds-backend/app.js"));
  ({ default: gatewayUserModel } = await import("../../ufds-backend/models/user.model.js"));
  ({ default: gatewayFileModel } = await import("../../ufds-backend/models/file.model.js"));
  ({ config: gatewayConfig } = await import("../../ufds-backend/config/env.js"));
  ({ signAccessToken } = await import("../../ufds-backend/utils/auth.js"));
  gatewayMongoose = gatewayUserModel.db.base;
  await gatewayUserModel.db.openUri(mongoUri);
  await Promise.all([gatewayUserModel.init(), gatewayFileModel.init()]);
  gatewayServer = createServer(gatewayApp);
  await new Promise((resolve) => gatewayServer.listen(0, "127.0.0.1", resolve));
  gatewayUrl = `http://127.0.0.1:${gatewayServer.address().port}`;
});

after(async () => {
  if (gatewayServer) await new Promise((resolve) => gatewayServer.close(resolve));
  if (storageServer) await new Promise((resolve) => storageServer.close(resolve));
  if (providers) {
    await Promise.all(providers.map((provider) => provider.adapter.connection.close()));
  }
  if (gatewayMongoose) await gatewayMongoose.disconnect();
  if (storageMongoose) await storageMongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("gateway proxies distributed files while preserving legacy GridFS access", async () => {
  const ownerId = userId();
  const user = await gatewayUserModel.create({
    _id: ownerId,
    name: "Integration User",
    email: `${ownerId}@example.test`,
    isActive: true,
  });
  const token = signAccessToken(user.id);
  const form = new FormData();
  form.append("file", new Blob([distributedBytes]), "distributed-test.bin");

  const uploadResponse = await fetch(`${gatewayUrl}/api/files/upload`, {
    method: "POST",
    headers: headersFor(token),
    body: form,
  });
  const uploadBody = await uploadResponse.json();
  assert.equal(uploadResponse.status, 201, JSON.stringify(uploadBody));
  assert.ok(uploadBody.file.id);

  const directHeaders = headersFor(token);
  delete directHeaders["X-Internal-Service-Token"];
  const directRequest = await fetch(
    `http://127.0.0.1:${storageServer.address().port}/api/files`,
    { headers: directHeaders },
  );
  assert.equal(directRequest.status, 401);

  const serviceOnlyRequest = await fetch(
    `http://127.0.0.1:${storageServer.address().port}/api/files`,
    { headers: { "X-Internal-Service-Token": internalServiceToken } },
  );
  assert.equal(serviceOnlyRequest.status, 401);

  const otherUserId = userId();
  const otherUser = await gatewayUserModel.create({
    _id: otherUserId,
    name: "Other User",
    email: `${otherUserId}@example.test`,
    isActive: true,
  });
  const crossOwnerRequest = await fetch(
    `http://127.0.0.1:${storageServer.address().port}/api/files/${uploadBody.file.id}/download`,
    { headers: headersFor(signAccessToken(otherUser.id)) },
  );
  assert.equal(crossOwnerRequest.status, 404);

  const legacyGridFsId = new gatewayMongoose.Types.ObjectId();
  const legacyBucket = new gatewayMongoose.mongo.GridFSBucket(
    gatewayUserModel.db.db,
    { bucketName: "uploads" },
  );
  const legacyUpload = legacyBucket.openUploadStreamWithId(
    legacyGridFsId,
    "legacy-test.txt",
    { contentType: "text/plain", metadata: { ownerId } },
  );
  await pipeline(Readable.from([legacyBytes]), legacyUpload);
  const legacyFile = await gatewayFileModel.create({
    ownerId,
    name: "legacy-test.txt",
    mimeType: "text/plain",
    size: legacyBytes.length,
    gridFsId: legacyGridFsId,
    sha256: crypto.createHash("sha256").update(legacyBytes).digest("hex"),
    status: "uploaded",
  });

  const listResponse = await fetch(`${gatewayUrl}/api/files`, {
    headers: headersFor(token),
  });
  const listBody = await listResponse.json();
  assert.equal(listResponse.status, 200);
  assert.deepEqual(
    new Set(listBody.files.map((file) => file.id)),
    new Set([uploadBody.file.id, String(legacyFile._id)]),
  );

  const distributedDownload = await fetch(
    `${gatewayUrl}/api/files/${uploadBody.file.id}/download`,
    { headers: headersFor(token) },
  );
  assert.equal(distributedDownload.status, 200);
  assert.deepEqual(Buffer.from(await distributedDownload.arrayBuffer()), distributedBytes);

  const healthResponse = await fetch(
    `${gatewayUrl}/api/files/${uploadBody.file.id}/health`,
    { headers: headersFor(token) },
  );
  const healthBody = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(healthBody.success, true);

  const legacyDownload = await fetch(
    `${gatewayUrl}/api/files/${legacyFile._id}/download`,
    { headers: headersFor(token) },
  );
  assert.equal(legacyDownload.status, 200);
  assert.deepEqual(Buffer.from(await legacyDownload.arrayBuffer()), legacyBytes);

  const deleteDistributed = await fetch(
    `${gatewayUrl}/api/files/${uploadBody.file.id}`,
    { method: "DELETE", headers: headersFor(token) },
  );
  assert.equal(deleteDistributed.status, 200);
  assert.equal(await storageFileModel.exists({ _id: uploadBody.file.id }), null);

  const deleteLegacy = await fetch(`${gatewayUrl}/api/files/${legacyFile._id}`, {
    method: "DELETE",
    headers: headersFor(token),
  });
  assert.equal(deleteLegacy.status, 200);
  assert.equal(await gatewayFileModel.exists({ _id: legacyFile._id }), null);
});

test("legacy gateway upload is disabled unless explicitly enabled", async () => {
  const originalUrl = gatewayConfig.distributedStorageUrl;
  const originalAllowed = gatewayConfig.allowLegacyUpload;
  gatewayConfig.distributedStorageUrl = "";
  gatewayConfig.allowLegacyUpload = false;
  try {
    const userIdValue = userId();
    const user = await gatewayUserModel.create({
      _id: userIdValue,
      name: "Legacy Guard User",
      email: `${userIdValue}@example.test`,
      isActive: true,
    });
    const form = new FormData();
    form.append("file", new Blob(["blocked"]), "blocked.txt");
    const response = await fetch(`${gatewayUrl}/api/files/upload`, {
      method: "POST",
      headers: headersFor(signAccessToken(user.id)),
      body: form,
    });
    assert.equal(response.status, 503);
  } finally {
    gatewayConfig.distributedStorageUrl = originalUrl;
    gatewayConfig.allowLegacyUpload = originalAllowed;
  }
});

test("migrates existing 4+1 metadata without removing legacy collection records", async () => {
  const id = new storageMongoose.Types.ObjectId();
  const legacyCollection = storageMongoose.connection.db.collection("files");
  const oldMetadata = {
    _id: id,
    user_id: new storageMongoose.Types.ObjectId(),
    status: "committed",
    createdAt: new Date(),
    originalSize: 1,
    unitSize: 1024 * 1024,
    unitCount: 1,
    ciphertextSize: 17,
    storageMode: "ec-4+1",
    shardSize: 1024 * 1024,
    groupCount: 1,
    erasure: { scheme: "4+1" },
    encryption: {
      algo: "chacha20-poly1305",
      keyVersion: 1,
      fileSalt: Buffer.alloc(32, 1).toString("base64"),
    },
    metaEnc: "encrypted-metadata",
    ciphertextSha256: "a".repeat(64),
    storageKey: crypto.randomBytes(32).toString("hex"),
  };
  await legacyCollection.insertOne(oldMetadata);
  const { migrateDistributedFileMetadata } = await import(
    "../src/services/fileMetadataMigration.service.js"
  );

  assert.equal(await migrateDistributedFileMetadata(), 1);
  assert.equal(String((await storageFileModel.findById(id))._id), String(id));
  assert.equal(await legacyCollection.countDocuments({ _id: id }), 1);
  assert.equal(await migrateDistributedFileMetadata(), 0);

  await Promise.all([
    legacyCollection.deleteOne({ _id: id }),
    storageFileModel.deleteOne({ _id: id }),
  ]);
});
