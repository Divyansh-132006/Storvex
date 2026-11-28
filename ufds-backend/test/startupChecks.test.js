import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function importGateway(additions, expression = "await import('./config/env.js')") {
  const env = {
    SystemRoot: process.env.SystemRoot || "",
    PATH: process.env.PATH || "",
    NODE_ENV: "production",
    MONGODB_URI: "mongodb://127.0.0.1:27017/gateway-startup-test",
    JWT_ACCESS_SECRET: "gateway-startup-test-secret",
    DISTRIBUTED_STORAGE_URL: "https://storage.example.test",
    INTERNAL_SERVICE_TOKEN: "gateway-startup-test-service-token",
    ALLOW_LEGACY_UPLOAD: "",
    ...additions,
  };
  return spawnSync(
    process.execPath,
    ["--input-type=module", "-e", expression],
    { cwd: backendDirectory, env, encoding: "utf8" },
  );
}

test("production gateway startup fails without distributed storage", () => {
  const result = importGateway({ DISTRIBUTED_STORAGE_URL: "" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DISTRIBUTED_STORAGE_URL is required/);
});

test("production gateway startup fails without its internal service token", () => {
  const result = importGateway({ INTERNAL_SERVICE_TOKEN: "" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /INTERNAL_SERVICE_TOKEN/);
});

test("production gateway trusts Render's single proxy hop", () => {
  const result = importGateway(
    {},
    "const {default:app}=await import('./app.js'); if(app.get('trust proxy')!==1) process.exit(3)",
  );
  assert.equal(result.status, 0, result.stderr);
});

test("legacy upload is opt-in and disabled by default", () => {
  const code = "const {config}=await import('./config/env.js'); if(config.allowLegacyUpload) process.exit(3)";
  const disabled = importGateway({
    NODE_ENV: "test",
    DISTRIBUTED_STORAGE_URL: "",
    INTERNAL_SERVICE_TOKEN: "",
    ALLOW_LEGACY_UPLOAD: "",
  }, code);
  assert.equal(disabled.status, 0, disabled.stderr);

  const enabled = importGateway({
    NODE_ENV: "test",
    DISTRIBUTED_STORAGE_URL: "",
    INTERNAL_SERVICE_TOKEN: "",
    ALLOW_LEGACY_UPLOAD: "true",
  }, "const {config}=await import('./config/env.js'); if(!config.allowLegacyUpload) process.exit(3)");
  assert.equal(enabled.status, 0, enabled.stderr);
});
