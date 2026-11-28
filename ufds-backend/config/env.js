import dns from "node:dns";
import "dotenv/config";
import { assertGatewayProductionConfig } from "./startupChecks.js";

const configuredDnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);
if (configuredDnsServers?.length) dns.setServers(configuredDnsServers);

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optional = (name, fallback = "") => process.env[name]?.trim() || fallback;
const normalizeUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const nodeEnv = process.env.NODE_ENV || process.env.Node_ENV || "development";
const configuredFrontendUrl = normalizeUrl(
  optional("FRONTEND_URL", process.env.CLIENT_URL || "https://storvex.onrender.com"),
);
const frontendUrl =
  nodeEnv === "production" &&
  (configuredFrontendUrl.startsWith("http://localhost") ||
    configuredFrontendUrl.includes("127.0.0.1"))
    ? "https://storvex.onrender.com"
    : configuredFrontendUrl;
const configuredGoogleCallbackUrl = normalizeUrl(
  optional(
    "GOOGLE_CALLBACK_URL",
    "https://storvexx.onrender.com/api/auth/google/callback",
  ),
);
const googleCallbackUrl =
  nodeEnv === "production" &&
  (configuredGoogleCallbackUrl.startsWith("http://localhost") ||
    configuredGoogleCallbackUrl.includes("127.0.0.1"))
    ? "https://storvexx.onrender.com/api/auth/google/callback"
    : configuredGoogleCallbackUrl;

export const config = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGODB_URI || required("DATABASE_URL"),
  frontendUrl,
  accessSecret: process.env.JWT_ACCESS_SECRET || required("JWT_SECRET"),
  refreshSecret: process.env.JWT_REFRESH_SECRET || optional("JWT_SECRET"),
  googleClientId: optional("GOOGLE_CLIENT_ID"),
  googleClientSecret: optional("GOOGLE_CLIENT_SECRET"),
  googleCallbackUrl,
  distributedStorageUrl: normalizeUrl(optional("DISTRIBUTED_STORAGE_URL")),
  internalServiceToken: optional("INTERNAL_SERVICE_TOKEN"),
  allowLegacyUpload: optional("ALLOW_LEGACY_UPLOAD") === "true",
  distributedStorageTimeoutMs: Number(
    process.env.DISTRIBUTED_STORAGE_TIMEOUT_MS || 900000,
  ),
  accessTokenTtl: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenTtlDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_MB || 500) * 1024 * 1024,
};

export const isProduction = config.nodeEnv === "production";
assertGatewayProductionConfig({
  NODE_ENV: config.nodeEnv,
  DISTRIBUTED_STORAGE_URL: config.distributedStorageUrl,
  INTERNAL_SERVICE_TOKEN: config.internalServiceToken,
});
