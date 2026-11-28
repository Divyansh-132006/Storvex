import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { warnForSharedProviderFailureDomains } from "../src/config/startupChecks.js";
import S3CompatibleAdapter from "../src/providers/S3CompatibleAdapter.js";

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryDirectory = path.resolve(serverDirectory, "..");

function runImport(directory, modulePath, additions = {}) {
  const env = {
    SystemRoot: process.env.SystemRoot || "",
    PATH: process.env.PATH || "",
    NODE_ENV: "production",
    MONGODB_URI: "mongodb://127.0.0.1:27017/startup-guard-test",
    JWT_ACCESS_SECRET: "startup-guard-test-secret",
    GOOGLE_CLIENT_ID: "startup-guard-test-client",
    MASTER_KEY_V1: Buffer.alloc(32, 1).toString("base64"),
    INTERNAL_SERVICE_TOKEN: "startup-guard-test-service-token",
    DISTRIBUTED_STORAGE_URL: "https://storage.example.test",
    ...additions,
  };
  return spawnSync(
    process.execPath,
    ["--input-type=module", "-e", `await import(${JSON.stringify(modulePath)})`],
    { cwd: directory, env, encoding: "utf8" },
  );
}

function storageProviderTypes(type = "s3") {
  const env = {};
  for (let number = 1; number <= 5; number += 1) {
    env[`PROVIDER_${number}_TYPE`] = type;
    if (type === "s3") {
      env[`PROVIDER_${number}_BUCKET`] = `startup-test-${number}`;
      env[`PROVIDER_${number}_ACCESS_KEY_ID`] = "";
      env[`PROVIDER_${number}_SECRET_ACCESS_KEY`] = "";
    }
  }
  return env;
}

test("production storage startup rejects any provider type not explicitly configured", () => {
  const env = storageProviderTypes();
  env.PROVIDER_3_TYPE = "";
  const result = runImport(serverDirectory, "./src/config/env.js", env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PROVIDER_3_TYPE/);
});

test("production storage startup rejects simulated GridFS unless explicitly allowed", () => {
  const env = storageProviderTypes();
  env.PROVIDER_2_TYPE = "gridfs";
  const rejected = runImport(serverDirectory, "./src/config/env.js", env);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /simulated storage/);

  const allowed = runImport(serverDirectory, "./src/config/env.js", {
    ...env,
    ALLOW_SIMULATED_PROVIDERS: "true",
  });
  assert.equal(allowed.status, 0, allowed.stderr);
});

test("production storage startup requires the internal service token", () => {
  const result = runImport(serverDirectory, "./src/config/env.js", {
    ...storageProviderTypes(),
    INTERNAL_SERVICE_TOKEN: "",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /INTERNAL_SERVICE_TOKEN/);
});

test("production gateway startup requires distributed storage and the service token", () => {
  const gatewayEnv = {
    SystemRoot: process.env.SystemRoot || "",
    PATH: process.env.PATH || "",
    NODE_ENV: "production",
    MONGODB_URI: "mongodb://127.0.0.1:27017/startup-guard-test",
    JWT_ACCESS_SECRET: "startup-guard-test-secret",
    INTERNAL_SERVICE_TOKEN: "startup-guard-test-service-token",
  };
  const missingStorage = runImport(repositoryDirectory, "./ufds-backend/config/env.js", {
    ...gatewayEnv,
    DISTRIBUTED_STORAGE_URL: "",
  });
  assert.notEqual(missingStorage.status, 0);
  assert.match(missingStorage.stderr, /DISTRIBUTED_STORAGE_URL is required/);

  const missingServiceToken = runImport(repositoryDirectory, "./ufds-backend/config/env.js", {
    ...gatewayEnv,
    DISTRIBUTED_STORAGE_URL: "https://storage.example.test",
    INTERNAL_SERVICE_TOKEN: "",
  });
  assert.notEqual(missingServiceToken.status, 0);
  assert.match(missingServiceToken.stderr, /INTERNAL_SERVICE_TOKEN/);
});

test("shared provider failure domains are warned about without exposing configuration", () => {
  const warnings = [];
  const env = {
    MONGODB_URI: "mongodb://private-user:private-password@mongo.example.test/db",
    PROVIDER_1_TYPE: "gridfs",
    PROVIDER_2_TYPE: "gridfs",
  };
  warnForSharedProviderFailureDomains(env, (message) => warnings.push(message));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /providers 1, 2/);
  assert.equal(warnings[0].includes("private-password"), false);
  assert.equal(warnings[0].includes("mongo.example.test"), false);
});

test("S3-compatible clients use optional checksum behavior", async () => {
  const adapter = new S3CompatibleAdapter(
    0,
    { region: "us-east-1", bucket: "verification-bucket" },
    { timeoutMs: 1000, maxRetries: 0 },
  );
  try {
    assert.equal(await adapter.client.config.requestChecksumCalculation(), "WHEN_REQUIRED");
    assert.equal(await adapter.client.config.responseChecksumValidation(), "WHEN_REQUIRED");
  } finally {
    adapter.client.destroy();
  }
});
