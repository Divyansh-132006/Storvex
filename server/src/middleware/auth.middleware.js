import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = verifyAccessToken(authorization.slice(7));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, "Authentication required"));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }
    next();
  };
}
