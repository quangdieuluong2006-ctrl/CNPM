import { defineConfig } from "vitest/config";

// Test dùng CSDL riêng ThuyetMinhDB_test để không đụng dữ liệu dev.
// Test tích hợp (cần SQL Server) chỉ chạy khi đặt RUN_DB_TESTS=1.
export default defineConfig({
  test: {
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DB_SERVER: process.env.DB_SERVER ?? "localhost",
      DB_PORT: process.env.DB_PORT ?? "1433",
      DB_NAME: "ThuyetMinhDB_test",
      DB_USER: process.env.DB_USER ?? "sa",
      DB_PASSWORD: process.env.DB_PASSWORD ?? "chua-dat-mat-khau",
      DB_TRUST_SERVER_CERTIFICATE: "true",
    },
  },
});
