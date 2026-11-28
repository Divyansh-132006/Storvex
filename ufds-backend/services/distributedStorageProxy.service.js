import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { config } from "../config/env.js";

const responseHeaders = [
  "content-type",
  "content-length",
  "content-disposition",
  "x-content-type-options",
];

export async function requestDistributedStorage(req, path, options = {}) {
  if (!config.distributedStorageUrl) {
    throw Object.assign(new Error("Distributed storage service is not configured"), {
      statusCode: 503,
    });
  }

  const headers = {};
  const authorization = req.get("authorization");
  if (authorization) headers.authorization = authorization;
  if (config.internalServiceToken) {
    headers["x-internal-service-token"] = config.internalServiceToken;
  }

  if (options.streamBody) {
    const contentType = req.get("content-type");
    const contentLength = req.get("content-length");
    const idempotencyKey = req.get("idempotency-key");
    if (contentType) headers["content-type"] = contentType;
    if (contentLength) headers["content-length"] = contentLength;
    if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;
  }

  const request = {
    method: options.method || req.method,
    headers,
    signal: AbortSignal.timeout(config.distributedStorageTimeoutMs),
  };
  if (options.streamBody) {
    request.body = Readable.toWeb(req);
    request.duplex = "half";
  }

  try {
    return await fetch(`${config.distributedStorageUrl}/api/files${path}`, request);
  } catch (cause) {
    const rootCause = cause?.cause || cause;
    const causeName = typeof cause?.name === "string" ? cause.name : "unknown";
    const causeCode = typeof rootCause?.code === "string" ? rootCause.code : "none";
    console.error(`Distributed storage proxy failed causeName=${causeName} causeCode=${causeCode}`);
    throw Object.assign(
      new Error("Distributed storage service is unavailable", { cause }),
      { statusCode: cause?.name === "TimeoutError" ? 504 : 502 },
    );
  }
}

export async function sendDistributedStorageResponse(upstream, res) {
  res.status(upstream.status);
  for (const name of responseHeaders) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  }

  if (!upstream.body) {
    res.end();
    return;
  }

  try {
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (error) {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    throw error;
  }
}
