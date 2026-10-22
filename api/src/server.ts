import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closePool, getPool } from "./db/pool.js";
import { logger } from "./lib/logger.js";

const server = createServer(createApp());

server.listen(env.PORT, () => {
  logger.info(`API đang chạy tại http://localhost:${env.PORT}`);
  getPool()
    .then(() => logger.info("Đã kết nối SQL Server"))
    .catch((err: unknown) => logger.error({ err }, "Chưa kết nối được SQL Server – kiểm tra docker compose và .env"));
});

// Tắt êm: ngừng nhận request mới rồi đóng kết nối CSDL.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    logger.info(`Nhận ${signal}, đang tắt…`);
    server.close(() => {
      closePool().finally(() => process.exit(0));
    });
  });
}
