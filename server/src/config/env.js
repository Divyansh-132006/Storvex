import dotenv from "dotenv";

dotenv.config();

const required = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "GOOGLE_CLIENT_ID",
];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || "development";
const cookieSecure = nodeEnv === "production"
  ? true
  : process.env.COOKIE_SECURE === "true";
const cookieSameSite = nodeEnv === "production"
  ? "none"
  : (process.env.COOKIE_SAMESITE || "lax");

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
});
