import { pipeline } from "node:stream/promises";
import {
  createShareLink,
  getShareInfo,
  listShareLinks,
  prepareShareDownload,
  revokeShareLink,
  rollbackShareDownload,
} from "../services/share.service.js";

function setPublicHeaders(res) {
  res.set({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
  });
}

export async function create(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      ...(await createShareLink(req.user.id, req.params.id, req.body)),
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      shares: await listShareLinks(req.user.id, req.params.id),
    });
  } catch (error) {
    next(error);
  }
}

export async function revoke(req, res, next) {
  try {
    res.json({
      success: true,
      ...(await revokeShareLink(req.user.id, req.params.shareId)),
    });
  } catch (error) {
    next(error);
  }
}

export async function info(req, res, next) {
  setPublicHeaders(res);
  try {
    res.json({ success: true, ...(await getShareInfo(req.params.token)) });
  } catch (error) {
    next(error);
  }
}

export async function download(req, res, next) {
  setPublicHeaders(res);
  let shareId;
  try {
    const result = await prepareShareDownload(
      req.params.token,
      req.body?.password,
      req.get("x-internal-client-ip") || req.ip,
    );
    shareId = result.shareId;
    res.set({
      "Content-Type": result.meta.mime,
      "Content-Length": String(result.file.originalSize),
      "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(result.meta.name)}`,
    });
    await pipeline(result.stream, res);
  } catch (error) {
    if (!res.headersSent) {
      if (shareId) {
        try {
          await rollbackShareDownload(shareId);
        } catch (rollbackError) {
          return next(rollbackError);
        }
      }
      return next(error);
    }
    res.destroy(error);
  }
}
