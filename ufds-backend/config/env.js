import "dotenv/config";

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optional = (name, fallback = "") => process.env[name]?.trim() || fallback;

export const config = {
  nodeEnv: process.env.NODE_ENV || process.env.Node_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGODB_URI || required("DATABASE_URL"),
  frontendUrl: optional("FRONTEND_URL", process.env.CLIENT_URL || "http://localhost:5173"),
  accessSecret: process.env.JWT_ACCESS_SECRET || required("JWT_SECRET"),
  refreshSecret: process.env.JWT_REFRESH_SECRET || optional("JWT_SECRET"),
  googleClientId: optional("GOOGLE_CLIENT_ID"),
  googleClientSecret: optional("GOOGLE_CLIENT_SECRET"),
  googleCallbackUrl: optional(
    "GOOGLE_CALLBACK_URL",
    `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`,
  ),
  accessTokenTtl: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenTtlDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),
};

export const isProduction = config.nodeEnv === "production";
