export function assertGatewayProductionConfig(env) {
  if (env.NODE_ENV !== "production") return;
  if (!String(env.DISTRIBUTED_STORAGE_URL || "").trim()) {
    throw new Error("DISTRIBUTED_STORAGE_URL is required in production");
  }
  if (Buffer.byteLength(String(env.INTERNAL_SERVICE_TOKEN || "").trim()) < 32) {
    throw new Error("INTERNAL_SERVICE_TOKEN must be at least 32 bytes in production");
  }
}
