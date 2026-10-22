import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { requestId } from "./middlewares/requestId.js";
import { healthRouter } from "./modules/health/health.routes.js";

// Tạo Express app tách khỏi server.ts để test bằng supertest không cần mở cổng.
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (_req, res) => res.locals.requestId as string }));
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.use(healthRouter);
  // Các module nghiệp vụ gắn dưới /api/v1 ở những ngày tiếp theo (auth, presence, jobs, admin…).

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
