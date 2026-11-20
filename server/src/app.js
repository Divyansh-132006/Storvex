import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import authRoutes from "./routes/auth.routes.js";
import { config } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === config.clientUrl) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

app.use("/api/auth", authRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
