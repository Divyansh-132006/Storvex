import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { config } from "./config/env.js";

const app = express();
app.use(helmet());
app.use(
    cors({
        origin: config.frontendUrl,
        credentials: true,
    })
);
app.use(express.json({
    limit: "1mb",
}));
app.use(cookieParser());
app.use("/api/auth", authRoutes);

app.get('/', (req, res)=>{
    res.status(200).json({
        success:true,
        message:"Welcome to Storvex Backend",
    })
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "Storvex API",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode
    : 500;
  if (status === 500) console.error("Unhandled request error", error.message);
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : error.message,
  });
});

export default app