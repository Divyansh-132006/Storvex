import {
  requestDistributedStorage,
  sendDistributedStorageResponse,
} from "../services/distributedStorageProxy.service.js";
import { config } from "../config/env.js";

function setPublicHeaders(res) {
  res.set({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
  });
}

function clientAbortSignal(req, res) {
  const controller = new AbortController();
  const abort = () => controller.abort(new Error("Client disconnected"));
  const timeout = setTimeout(() => {
    const error = new Error("Distributed storage request timed out");
    error.name = "TimeoutError";
    controller.abort(error);
  }, config.distributedStorageTimeoutMs);
  const onClose = () => {
    if (!res.writableEnded) abort();
  };
  const cleanup = () => {
    clearTimeout(timeout);
    req.off("aborted", abort);
    res.off("close", onClose);
    res.off("finish", cleanup);
  };
  req.once("aborted", abort);
  res.once("close", onClose);
  res.once("finish", cleanup);
  return { signal: controller.signal, cleanup };
}

export async function createShare(req, res, next) {
  try {
    const upstream = await requestDistributedStorage(
      req,
      `/${encodeURIComponent(req.params.id)}/shares`,
      { method: "POST", jsonBody: req.body },
    );
    return await sendDistributedStorageResponse(upstream, res);
  } catch (error) {
    return next(error);
  }
}

export async function listShares(req, res, next) {
  try {
    const upstream = await requestDistributedStorage(
      req,
      `/${encodeURIComponent(req.params.id)}/shares`,
      { method: "GET" },
    );
    return await sendDistributedStorageResponse(upstream, res);
  } catch (error) {
    return next(error);
  }
}

export async function revokeShare(req, res, next) {
  try {
    const upstream = await requestDistributedStorage(
      req,
      `/${encodeURIComponent(req.params.shareId)}`,
      { method: "DELETE", basePath: "/api/shares" },
    );
    return await sendDistributedStorageResponse(upstream, res);
  } catch (error) {
    return next(error);
  }
}

async function proxyPublicShare(req, res, next) {
  setPublicHeaders(res);
  const abort = clientAbortSignal(req, res);
  try {
    const suffix =
      req.path.endsWith("/info")
        ? `/${encodeURIComponent(req.params.token)}/info`
        : `/${encodeURIComponent(req.params.token)}/download`;
    const upstream = await requestDistributedStorage(req, suffix, {
      basePath: "/api/share",
      forwardAuthorization: false,
      forwardClientIp: true,
      jsonBody: req.method === "POST" ? req.body : undefined,
      signal: abort.signal,
    });
    return await sendDistributedStorageResponse(upstream, res);
  } catch (error) {
    return next(error);
  } finally {
    abort.cleanup();
  }
}

export const shareInfo = proxyPublicShare;
export const shareDownload = proxyPublicShare;
