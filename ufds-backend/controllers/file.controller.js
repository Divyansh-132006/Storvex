import {
  deleteStoredFile,
  getDownloadStream,
  isLegacyStoredFile,
  listStoredFiles,
  uploadStoredFile,
} from "../services/file.service.js";
import {
  requestDistributedStorage,
  sendDistributedStorageResponse,
} from "../services/distributedStorageProxy.service.js";
import { config } from "../config/env.js";

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

export const uploadFile = async (req, res, next) => {
  try {
    if (config.distributedStorageUrl) {
      const upstream = await requestDistributedStorage(req, "/upload", {
        method: "POST",
        streamBody: true,
      });
      return await sendDistributedStorageResponse(upstream, res);
    }
    if (!config.allowLegacyUpload) {
      throw httpError(503, "Distributed storage is not configured and legacy uploads are disabled");
    }
    const file = await uploadStoredFile(req, req.user.id);
    return res.status(201).json({ success: true, file });
  } catch (error) {
    return next(error);
  }
};

export const listFiles = async (req, res, next) => {
  try {
    const legacyFiles = await listStoredFiles(req.user.id);
    if (!config.distributedStorageUrl) {
      return res.json({ success: true, files: legacyFiles });
    }

    const upstream = await requestDistributedStorage(req, "/");
    if (!upstream.ok) {
      return await sendDistributedStorageResponse(upstream, res);
    }
    let payload;
    try {
      payload = await upstream.json();
    } catch (cause) {
      throw Object.assign(new Error("Distributed storage returned an invalid response"), {
        statusCode: 502,
        cause,
      });
    }
    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.success ||
      !Array.isArray(payload.files)
    ) {
      throw Object.assign(new Error("Distributed storage returned an invalid file list"), {
        statusCode: 502,
      });
    }
    const files = [...legacyFiles, ...payload.files].sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
    );
    return res.json({ success: true, files });
  } catch (error) {
    return next(error);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    if (
      config.distributedStorageUrl &&
      !(await isLegacyStoredFile(req.user.id, req.params.id))
    ) {
      const upstream = await requestDistributedStorage(
        req,
        `/${encodeURIComponent(req.params.id)}/download`,
      );
      return await sendDistributedStorageResponse(upstream, res);
    }

    const download = await getDownloadStream(req.user.id, req.params.id);
    res.set({
      "Content-Type": download.mimeType,
      "Content-Length": String(download.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(download.name)}`,
      "X-Content-Type-Options": "nosniff",
    });
    return download.stream.pipe(res);
  } catch (error) {
    return next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    if (
      config.distributedStorageUrl &&
      !(await isLegacyStoredFile(req.user.id, req.params.id))
    ) {
      const upstream = await requestDistributedStorage(
        req,
        `/${encodeURIComponent(req.params.id)}`,
        { method: "DELETE" },
      );
      return await sendDistributedStorageResponse(upstream, res);
    }

    await deleteStoredFile(req.user.id, req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

export const fileHealth = async (req, res, next) => {
  try {
    if (await isLegacyStoredFile(req.user.id, req.params.id)) {
      return res.json({
        success: true,
        health: {
          groups: 1,
          healthyGroups: 1,
          degradedGroups: 0,
          unrecoverableGroups: 0,
          status: "healthy",
        },
      });
    }
    if (!config.distributedStorageUrl) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const upstream = await requestDistributedStorage(
      req,
      `/${encodeURIComponent(req.params.id)}/health`,
    );
    return await sendDistributedStorageResponse(upstream, res);
  } catch (error) {
    return next(error);
  }
};
