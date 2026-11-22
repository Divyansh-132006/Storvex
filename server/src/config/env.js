import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_ACCESS_SECRET", "GOOGLE_CLIENT_ID"];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || "development";
const cookieSecure =
  nodeEnv === "production" ? true : process.env.COOKIE_SECURE === "true";
const cookieSameSite =
  nodeEnv === "production" ? "none" : process.env.COOKIE_SAMESITE || "lax";

const currentKeyVersion = Number(process.env.CURRENT_KEY_VERSION || 1);
const masterKeys = new Map();
for (const name of Object.keys(process.env).filter((key) =>
  /^MASTER_KEY_V\d+$/.test(key),
)) {
  const version = Number(name.slice("MASTER_KEY_V".length));
  const value = Buffer.from(process.env[name], "base64");
  if (!Number.isInteger(version) || value.length !== 32) {
    throw new Error(`${name} must be base64 for exactly 32 bytes`);
  }
  masterKeys.set(version, value);
}
if (!masterKeys.has(currentKeyVersion)) {
  throw new Error(`Missing MASTER_KEY_V${currentKeyVersion}`);
}

export const config = Object.freeze({
  port: Number(process.env.PORT || 5000),
  nodeEnv,
  mongoUri: process.env.MONGODB_URI,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  refreshCookieName: process.env.JWT_REFRESH_COOKIE_NAME || "ufds_rt",
  cookieSecure,
  cookieSameSite,
  currentKeyVersion,
  masterKeys,
  storageDir: process.env.STORAGE_DIR || "./storage/encrypted",
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_MB || 500) * 1024 * 1024,
  maxUserStorageBytes:
    Number(process.env.MAX_USER_STORAGE_MB || 2048) * 1024 * 1024,
  unitSize: Number(process.env.UNIT_SIZE_BYTES || 1048576),
  verifyCiphertextHashOnDownload:
    process.env.VERIFY_CIPHERTEXT_HASH_ON_DOWNLOAD !== "false",
});
