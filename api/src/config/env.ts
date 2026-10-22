import { z } from "zod";

// Đọc và kiểm tra biến môi trường một lần khi khởi động; sai/thiếu thì dừng ngay (fail-fast).
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DB_SERVER: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_NAME: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Tên CSDL chỉ gồm chữ, số, dấu gạch dưới"),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_ENCRYPT: z.stringbool().default(true),
  DB_TRUST_SERVER_CERTIFICATE: z.stringbool().default(false),
  SEED_PASSWORD: z.string().min(8).default("Demo@12345"),
  // Xác thực (PRD v3.0, mục 3.5, 11.1)
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET cần ít nhất 32 ký tự ngẫu nhiên"),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  // Bật khi chạy HTTPS (staging/production); dev dùng http://localhost nên để false.
  COOKIE_SECURE: z.stringbool().default(false),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:5174")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`Biến môi trường không hợp lệ (xem api/.env.example):\n${issues}`);
    process.exit(1);
  }
  if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_ACCESS_SECRET.startsWith("doi-chuoi-nay")) {
    console.error("JWT_ACCESS_SECRET vẫn là giá trị mẫu – hãy đổi trước khi chạy production.");
    process.exit(1);
  }
  return parsed.data;
}

export const env = load();
