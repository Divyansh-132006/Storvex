import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { getUser } from "../services/auth.service.js";

export const requireSameOrigin = (req, res, next) => {
  const origin = req.get("origin");
  if (origin && origin !== config.frontendUrl) {
    return res.status(403).json({ success: false, message: "Invalid request origin" });
  }
  next();
};

export const requireAuth = async (req, res, next) => {
  const header = req.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
  try {
    const payload = jwt.verify(token, config.accessSecret);
    if (typeof payload === "string" || payload.type !== "access" || !payload.sub) {
      throw new Error("Invalid token");
    }
    const user = await getUser(payload.sub);
    if (!user) return res.status(401).json({ success: false, message: "Authentication required" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
};
