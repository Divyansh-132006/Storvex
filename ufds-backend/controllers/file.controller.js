import {
  deleteStoredFile,
  getDownloadStream,
  listStoredFiles,
  uploadStoredFile,
} from "../services/file.service.js";

export const uploadFile = async (req, res, next) => {
  try {
    const file = await uploadStoredFile(req, req.user.id);
    return res.status(201).json({ success: true, file });
  } catch (error) {
    return next(error);
  }
};

export const listFiles = async (req, res, next) => {
  try {
    const files = await listStoredFiles(req.user.id);
    return res.json({ success: true, files });
  } catch (error) {
    return next(error);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
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
    await deleteStoredFile(req.user.id, req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};
