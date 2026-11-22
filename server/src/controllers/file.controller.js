import { pipeline } from "node:stream/promises";
import {
  deleteFile,
  getDownload,
  listFiles,
  uploadFile,
} from "../services/file.service.js";

export async function upload(req, res, next) {
  try {
    res.status(201).json({ success: true, file: await uploadFile(req) });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    res.json({ success: true, files: await listFiles(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function download(req, res, next) {
  try {
    const { file, meta, stream } = await getDownload(
      req.user.id,
      req.params.id,
    );
    res.set({
      "Content-Type": meta.mime,
      "Content-Length": String(file.originalSize),
      "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      "X-Content-Type-Options": "nosniff",
    });
    await pipeline(stream, res);
  } catch (error) {
    if (!res.headersSent) return next(error);
    res.destroy(error);
  }
}

export async function remove(req, res, next) {
  try {
    await deleteFile(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
