import crypto from "node:crypto";
import ApiError from "../utils/ApiError.js";
import { config } from "../config/env.js";

export function requireInternalService(req, res, next) {
  const expected = config.internalServiceToken;
  const supplied = req.get("x-internal-service-token") || "";
  const expectedDigest = crypto.createHash("sha256").update(expected).digest();
  const suppliedDigest = crypto.createHash("sha256").update(supplied).digest();
  const matches = crypto.timingSafeEqual(expectedDigest, suppliedDigest);
  if (
    Buffer.byteLength(expected) < 32 ||
    expected.length !== supplied.length ||
    !matches
  ) {
    return next(new ApiError(401, "Service authentication required"));
  }
  return next();
}
