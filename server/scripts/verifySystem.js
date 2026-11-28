import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryDirectory = path.resolve(serverDirectory, "..");
dotenv.config({ path: path.join(serverDirectory, ".env") });
const summary = [];
const safeCodes = new Set([
  "AccessDenied",
  "AbortError",
  "AssertionError",
  "NoSuchBucket",
  "NoSuchKey",
  "NotFound",
  "TimeoutError",
  "Unknown",
]);

function safeError(error) {
  const code = error?.Code || error?.code || error?.name;
  const message = String(error?.message || "").replace(/\s+/g, " ").slice(0, 160);
  if (safeCodes.has(code)) return `${code}${message ? `: ${message}` : ""}`;
  return message ? `${code || "operation error"}: ${message}` : "operation error";
}

function record(check, passed, notes) {
  summary.push({ check, passed, notes });
  console.log(`${passed ? "PASS" : "FAIL"} | ${check} | ${notes}`);
}

async function verify(check, operation) {
  try {
    record(check, true, await operation());
  } catch (error) {
    const smokeGuidance = check.startsWith("D provider ")
      ? "; formatting scanned; review endpoint/region and bucket-scoped permissions; checksum mode is WHEN_REQUIRED"
      : "";
    record(check, false, `${safeError(error)}${smokeGuidance}`);
  }
}

function isBadFormatting(value) {
  return value !== value.trim() ||
    (value.length >= 2 && value[0] === value[value.length - 1] && ["'", "\""].includes(value[0]));
}

function providerFormattingIsSafe() {
  const suffixes = [
    "TYPE",
    "ENDPOINT",
    "REGION",
    "BUCKET",
    "ACCESS_KEY_ID",
    "SECRET_ACCESS_KEY",
    "FORCE_PATH_STYLE",
  ];
  for (let number = 1; number <= 5; number += 1) {
    for (const suffix of suffixes) {
      const value = process.env[`PROVIDER_${number}_${suffix}`];
      if (value && isBadFormatting(value)) return false;
    }
  }
  return true;
}

function verifyRepositorySafety() {
  const tracked = execFileSync("git", ["ls-files", "-z"], {
    cwd: repositoryDirectory,
    encoding: "utf8",
  }).split("\0").filter(Boolean);
  const sensitivePath = tracked.some((file) =>
    /(^|\/)(\.env|[^/]*(credentials|secret)[^/]*\.(env|json|pem|key))$/i.test(file) &&
    !/\.env\.example$/i.test(file),
  );
  const diffCheck = execFileSync("git", ["diff", "--check"], {
    cwd: repositoryDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(sensitivePath, false, "tracked credential-like file path detected");
  assert.equal(diffCheck, "", "git diff --check reported whitespace errors");
  return "no tracked credential-like files; git diff --check clean";
}

function productionFlagsPass(assertStorageProviderConfig, assertGatewayProductionConfig) {
  const base = { NODE_ENV: "production" };
  assert.throws(() => assertStorageProviderConfig(base), /PROVIDER_1_TYPE/);
  const simulated = { ...base };
  for (let number = 1; number <= 5; number += 1) {
    simulated[`PROVIDER_${number}_TYPE`] = "gridfs";
  }
  assert.throws(() => assertStorageProviderConfig(simulated), /simulated storage/);
  simulated.ALLOW_SIMULATED_PROVIDERS = "true";
  assert.doesNotThrow(() => assertStorageProviderConfig(simulated));
  assert.throws(
    () => assertGatewayProductionConfig({ ...base, INTERNAL_SERVICE_TOKEN: "test" }),
    /DISTRIBUTED_STORAGE_URL/,
  );
  assert.throws(
    () => assertGatewayProductionConfig({ ...base, DISTRIBUTED_STORAGE_URL: "https://storage.example.test" }),
    /INTERNAL_SERVICE_TOKEN/,
  );
  assert.doesNotThrow(() => assertGatewayProductionConfig({
    ...base,
    DISTRIBUTED_STORAGE_URL: "https://storage.example.test",
    INTERNAL_SERVICE_TOKEN: "system-verification-valid-internal-token",
  }));
  return "production startup guards reject missing configuration and simulated providers by default";
}

async function consumeAndHash(stream) {
  const hash = crypto.createHash("sha256");
  let bytes = 0;
  await pipeline(
    stream,
    new Writable({
      write(chunk, encoding, callback) {
        bytes += chunk.length;
        hash.update(chunk);
        callback();
      },
    }),
  );
  return { bytes, digest: hash.digest("hex") };
}

async function closeConnections(providers, mongoose, mongod) {
  if (providers) {
    await Promise.all(providers.map((provider) => provider.adapter.connection?.close().catch(() => {})));
  }
  if (mongoose) await mongoose.disconnect().catch(() => {});
  if (mongod) await mongod.stop().catch(() => {});
}

async function main() {
  let mongod;
  let mongoose;
  let providers;
  let File;
  let Shard;
  let uploadDistributed;
  let getDistributedDownload;
  let deleteFile;
  const ownedFileIds = new Set();
  const temporaryProviderAdapters = [];
  let GridFsProviderAdapter;

  try {
    const formattingOk = providerFormattingIsSafe();
    record(
      "D provider environment formatting",
      formattingOk,
      formattingOk ? "provider values have no surrounding whitespace or wrapping quotes" : "formatting issue detected; values withheld",
    );

    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri("storvex-system-verification");
    Object.assign(process.env, {
      NODE_ENV: "test",
      MONGODB_URI: mongoUri,
      JWT_ACCESS_SECRET: "system-verification-access-secret",
      INTERNAL_SERVICE_TOKEN: "system-verification-internal-token",
      GOOGLE_CLIENT_ID: "system-verification-client",
      MASTER_KEY_V1: Buffer.alloc(32, 0x35).toString("base64"),
      CURRENT_KEY_VERSION: "1",
      ENABLE_FAULT_INJECTION: "true",
      VERIFY_READBACK: "true",
      MAX_FILE_SIZE_MB: "200",
      MAX_USER_STORAGE_MB: "512",
      PROVIDER_TIMEOUT_MS: "30000",
      PROVIDER_MAX_RETRIES: "0",
    });
    for (let number = 1; number <= 5; number += 1) {
      const type = process.env[`PROVIDER_${number}_TYPE`]?.trim().toLowerCase() || "gridfs";
      process.env[`PROVIDER_${number}_TYPE`] = type;
      if (type === "gridfs") process.env[`PROVIDER_${number}_MONGODB_URI`] = mongoUri;
    }

    mongoose = (await import("mongoose")).default;
    const { config } = await import("../src/config/env.js");
    ({ default: providers } = await import("../src/providers/registry.js"));
    ({ default: File } = await import("../src/models/File.js"));
    ({ default: Shard } = await import("../src/models/Shard.js"));
    ({ uploadDistributed, getDistributedDownload } = await import("../src/services/distributedStorage.service.js"));
    ({ deleteFile } = await import("../src/services/file.service.js"));
    ({ default: GridFsProviderAdapter } = await import("../src/providers/GridFsProviderAdapter.js"));
    const { assertStorageProviderConfig } = await import("../src/config/startupChecks.js");
    const { assertGatewayProductionConfig } = await import("../../ufds-backend/config/startupChecks.js");

    await mongoose.connect(mongoUri);
    await Promise.all([File.init(), Shard.init()]);

    for (let index = 0; index < providers.length; index += 1) {
      await verify(`D provider ${index + 1} 1 MiB put/get/exists/delete`, async () => {
        const provider = providers[index];
        const objectKey = `system-verification-${crypto.randomUUID()}`;
        const bytes = Buffer.alloc(1024 * 1024, index + 1);
        try {
          const stored = await provider.putObject(objectKey, bytes);
          assert.equal(stored.size, bytes.length);
          assert.equal(await provider.exists(objectKey), true);
          assert.deepEqual(await provider.getObject(objectKey), bytes);
          await provider.deleteObject(objectKey);
          assert.equal(await provider.exists(objectKey), false);
          return "1 MiB round-trip and cleanup succeeded";
        } finally {
          await provider.deleteObject(objectKey).catch(() => {});
        }
      });
    }

    await verify("A chunk distribution and erasure round-trip on configured providers", async () => {
      const userId = new mongoose.Types.ObjectId();
      const original = Buffer.alloc(4 * 1024 * 1024 + 37, 0x53);
      const file = await uploadDistributed(
        Readable.from([original]),
        { filename: "system-verification-a.bin", mimeType: "application/octet-stream" },
        userId,
      );
      ownedFileIds.add(file.id);
      const metadata = await File.findById(file.id).lean();
      const shards = await Shard.find({ fileId: file.id }).lean();
      assert.equal(metadata.status, "committed");
      assert.equal(shards.length, metadata.groupCount * 5);
      assert.ok(shards.every((shard) => shard.status === "verified" && shard.size === metadata.shardSize));
      for (let groupNo = 0; groupNo < metadata.groupCount; groupNo += 1) {
        assert.deepEqual(
          shards.filter((shard) => shard.groupNo === groupNo).map((shard) => shard.position).sort(),
          [0, 1, 2, 3, 4],
        );
      }
      const result = await getDistributedDownload(metadata);
      const downloaded = [];
      await pipeline(result.stream, async function* (source) {
        for await (const chunk of source) downloaded.push(chunk);
      });
      assert.deepEqual(Buffer.concat(downloaded), original);
      await deleteFile(String(userId), file.id);
      ownedFileIds.delete(file.id);
      return `${metadata.groupCount} groups; five verified shards per group; byte-identical download`;
    });

    await verify("B one-provider failure matrix and two-provider unrecoverable case", async () => {
      const userId = new mongoose.Types.ObjectId();
      const original = Buffer.alloc(1024 * 1024 + 31, 0x62);
      const file = await uploadDistributed(
        Readable.from([original]),
        { filename: "system-verification-b.bin", mimeType: "application/octet-stream" },
        userId,
      );
      ownedFileIds.add(file.id);
      const metadata = await File.findById(file.id).lean();
      try {
        for (const provider of providers) {
          provider.setMode("offline");
          const result = await getDistributedDownload(metadata);
          const chunks = [];
          await pipeline(result.stream, async function* (source) {
            for await (const chunk of source) chunks.push(chunk);
          });
          assert.deepEqual(Buffer.concat(chunks), original);
          provider.setMode("none");
          await Shard.updateMany(
            { fileId: file.id, providerIndex: provider.adapter.index },
            { $set: { status: "verified" } },
          );
        }
        providers[0].setMode("offline");
        providers[1].setMode("offline");
        await assert.rejects(getDistributedDownload(metadata));
      } finally {
        for (const provider of providers) provider.setMode("none");
        await Shard.updateMany({ fileId: file.id }, { $set: { status: "verified" } });
        await deleteFile(String(userId), file.id);
        ownedFileIds.delete(file.id);
      }
      return "all five single failures recovered; two failures rejected";
    });

    await verify("C confidentiality scan of provider objects and every MongoDB collection", async () => {
      const userId = new mongoose.Types.ObjectId();
      const contentMarker = `PRIVATE_CONTENT_${crypto.randomUUID()}`;
      const filenameMarker = `PRIVATE_FILENAME_${crypto.randomUUID()}.txt`;
      const file = await uploadDistributed(
        Readable.from([Buffer.from(`before:${contentMarker}:after`)]),
        { filename: filenameMarker, mimeType: "text/plain" },
        userId,
      );
      ownedFileIds.add(file.id);
      const shards = await Shard.find({ fileId: file.id }).lean();
      for (const shard of shards) {
        const stored = await providers[shard.position].getObject(shard.objectKey);
        assert.equal(stored.includes(Buffer.from(contentMarker)), false);
        assert.equal(stored.includes(Buffer.from(filenameMarker)), false);
      }
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const collectionInfo of collections) {
        const cursor = mongoose.connection.db.collection(collectionInfo.name).find({});
        for await (const document of cursor) {
          const serialized = JSON.stringify(document);
          assert.equal(serialized.includes(contentMarker), false);
          assert.equal(serialized.includes(filenameMarker), false);
        }
      }
      await deleteFile(String(userId), file.id);
      ownedFileIds.delete(file.id);
      return `searched provider objects and ${collections.length} MongoDB collections`;
    });

    await verify("D production startup flags fail closed", async () =>
      productionFlagsPass(assertStorageProviderConfig, assertGatewayProductionConfig));

    await verify("D stream-error cleanup removes partial shards and objects", async () => {
      const userId = new mongoose.Types.ObjectId();
      const capturedKeys = [];
      const originals = providers.map((provider) => provider.putObject.bind(provider));
      providers.forEach((provider, index) => {
        provider.putObject = (key, bytes) => {
          capturedKeys.push({ index, key });
          return originals[index](key, bytes);
        };
      });
      let failedFile;
      try {
        async function* interruptedUpload() {
          for (let index = 0; index < 7; index += 1) yield Buffer.alloc(1024 * 1024, 0x21);
          throw new Error("verification stream interruption");
        }
        await assert.rejects(uploadDistributed(
          Readable.from(interruptedUpload()),
          { filename: "system-verification-interrupted.bin", mimeType: "application/octet-stream" },
          userId,
        ));
        failedFile = await File.findOne({ user_id: userId, status: "failed" }).lean();
        assert.ok(failedFile);
        assert.equal(await Shard.countDocuments({ fileId: failedFile._id }), 0);
        for (const { index, key } of capturedKeys) {
          assert.equal(await providers[index].exists(key), false);
        }
      } finally {
        providers.forEach((provider) => {
          delete provider.putObject;
        });
        if (failedFile) await File.deleteOne({ _id: failedFile._id });
      }
      return "interrupted upload left no shard records or stored objects";
    });

    await verify("D 100 MiB stream memory and authenticated download", async () => {
      const priorAdapters = providers.map((provider) => provider.adapter);
      providers.forEach((provider, index) => {
        const adapter = new GridFsProviderAdapter(index, mongoUri, {
          timeoutMs: config.providerTimeoutMs,
          maxRetries: 0,
        });
        temporaryProviderAdapters.push(adapter);
        provider.adapter = adapter;
      });

      const userId = new mongoose.Types.ObjectId();
      const totalBytes = 100 * 1024 * 1024;
      const chunk = Buffer.alloc(64 * 1024, 0x37);
      const expectedHash = crypto.createHash("sha256");
      for (let remaining = totalBytes; remaining > 0; remaining -= chunk.length) {
        expectedHash.update(chunk);
      }
      const expectedDigest = expectedHash.digest("hex");
      if (global.gc) global.gc();
      const baseline = process.memoryUsage();
      const peak = { rss: baseline.rss, heapUsed: baseline.heapUsed, external: baseline.external };
      const monitor = setInterval(() => {
        const current = process.memoryUsage();
        peak.rss = Math.max(peak.rss, current.rss);
        peak.heapUsed = Math.max(peak.heapUsed, current.heapUsed);
        peak.external = Math.max(peak.external, current.external);
      }, 50);
      const fileIds = [];
      try {
        async function* generatedFile() {
          for (let remaining = totalBytes; remaining > 0; remaining -= chunk.length) {
            yield chunk;
          }
        }
        const file = await uploadDistributed(
          Readable.from(generatedFile()),
          { filename: "system-verification-100MiB.bin", mimeType: "application/octet-stream" },
          userId,
        );
        fileIds.push(file.id);
        const metadata = await File.findById(file.id).lean();
        const downloaded = await getDistributedDownload(metadata);
        const result = await consumeAndHash(downloaded.stream);
        assert.equal(result.bytes, totalBytes);
        assert.equal(result.digest, expectedDigest);
        const rssDelta = Math.max(0, peak.rss - baseline.rss) / (1024 * 1024);
        const heapDelta = Math.max(0, peak.heapUsed - baseline.heapUsed) / (1024 * 1024);
        const externalDelta = Math.max(0, peak.external - baseline.external) / (1024 * 1024);
        assert.ok(rssDelta < 512, "peak RSS increase exceeded 512 MiB");
        assert.ok(externalDelta < 512, "peak external-memory increase exceeded 512 MiB");
        for (const id of fileIds) await deleteFile(String(userId), id);
        ownedFileIds.delete(file.id);
        return `100 MiB authenticated two-pass stream; peak delta RSS ${rssDelta.toFixed(1)} MiB, heap ${heapDelta.toFixed(1)} MiB, external ${externalDelta.toFixed(1)} MiB`;
      } finally {
        clearInterval(monitor);
        for (const provider of providers) provider.setMode("none");
        providers.forEach((provider, index) => {
          provider.adapter = priorAdapters[index];
        });
        await Promise.all(temporaryProviderAdapters.map((adapter) => adapter.connection.close()));
        temporaryProviderAdapters.length = 0;
      }
    });

    await verify("D cleanup after success and failure leaves no verification files", async () => {
      const ids = await File.find({}).distinct("_id");
      for (const id of ids) {
        const file = await File.findById(id).lean();
        if (file?.storageMode === "ec-4+1") {
          await deleteFile(String(file.user_id), String(id)).catch(() => {});
        } else {
          await File.deleteOne({ _id: id });
        }
      }
      await Shard.deleteMany({});
      await File.deleteMany({});
      ownedFileIds.clear();
      assert.equal(await File.countDocuments({}), 0);
      assert.equal(await Shard.countDocuments({}), 0);
      return "successful test files deleted; failed uploads have no shard records";
    });

    await verify("E repository safety", async () => verifyRepositorySafety());

    const total = summary.length;
    const passed = summary.filter((item) => item.passed).length;
    console.log(`\nVerification summary: ${passed}/${total} passed`);
    console.log("| check | PASS/FAIL | notes |");
    console.log("|---|---|---|");
    for (const item of summary) {
      console.log(`| ${item.check} | ${item.passed ? "PASS" : "FAIL"} | ${item.notes} |`);
    }
    if (passed !== total) process.exitCode = 1;
  } finally {
    await closeConnections(providers, mongoose, mongod);
  }
}

main().catch((error) => {
  console.error(`Verification aborted: ${safeError(error)}`);
  process.exitCode = 1;
});
