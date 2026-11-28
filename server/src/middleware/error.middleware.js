export function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  if (req.aborted || res.destroyed) return;

  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 ? "Internal server error" : err.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
}
