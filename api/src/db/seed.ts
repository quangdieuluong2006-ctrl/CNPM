import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { dbConfig, sql } from "./pool.js";

// Dữ liệu mẫu cho môi trường dev/demo (PRD v3.0, mục 9.5). Chạy lại nhiều lần vẫn an toàn.
const PLANS = [
  { name: "Free", maxFileSizeMb: 500, maxDurationMin: 30, monthlyQuotaMin: 60, maxTargetLanguages: 2 },
  { name: "Giáo dục", maxFileSizeMb: 1024, maxDurationMin: 60, monthlyQuotaMin: 300, maxTargetLanguages: 5 },
  { name: "Pro", maxFileSizeMb: 2048, maxDurationMin: 60, monthlyQuotaMin: 600, maxTargetLanguages: 5 },
];

const LANGUAGES: [code: string, nameNative: string][] = [
  ["vi", "Tiếng Việt"], ["en", "English"], ["zh", "中文（简体）"], ["ja", "日本語"], ["ko", "한국어"],
  ["fr", "Français"], ["de", "Deutsch"], ["es", "Español"], ["th", "ไทย"], ["id", "Bahasa Indonesia"],
];

export const DEMO_USERS = [
  { email: "admin@demo.vn", fullName: "Quản trị viên", role: "admin", plan: "Pro" },
  { email: "user1@demo.vn", fullName: "Nguyễn Văn An", role: "user", plan: "Free" },
  { email: "user2@demo.vn", fullName: "Trần Thị Bình", role: "user", plan: "Giáo dục" },
  { email: "user3@demo.vn", fullName: "Lê Hoàng Cường", role: "user", plan: "Free" },
  { email: "user4@demo.vn", fullName: "Phạm Minh Dũng", role: "user", plan: "Pro" },
  { email: "user5@demo.vn", fullName: "Hoàng Thu Hà", role: "user", plan: "Free" },
  { email: "user6@demo.vn", fullName: "Vũ Đức Khang", role: "user", plan: "Giáo dục" },
] as const;

// Bộ sinh số giả ngẫu nhiên cố định để mỗi lần seed ra cùng dữ liệu.
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

export async function seed(log: (msg: string) => void = console.log): Promise<void> {
  const pool = await new sql.ConnectionPool(dbConfig()).connect();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  const req = () => new sql.Request(tx);
  try {
    for (const p of PLANS) {
      await req()
        .input("name", sql.NVarChar, p.name)
        .input("size", sql.Int, p.maxFileSizeMb)
        .input("dur", sql.Int, p.maxDurationMin)
        .input("quota", sql.Int, p.monthlyQuotaMin)
        .input("langs", sql.TinyInt, p.maxTargetLanguages).query(`
          MERGE dbo.plans AS t USING (SELECT @name AS name) AS s ON t.name = s.name
          WHEN MATCHED THEN UPDATE SET max_file_size_mb = @size, max_duration_min = @dur,
               monthly_quota_min = @quota, max_target_languages = @langs
          WHEN NOT MATCHED THEN INSERT (name, max_file_size_mb, max_duration_min, monthly_quota_min, max_target_languages)
               VALUES (@name, @size, @dur, @quota, @langs);`);
    }

    for (const [code, nameNative] of LANGUAGES) {
      await req().input("code", sql.VarChar, code).input("name", sql.NVarChar, nameNative).query(`
        MERGE dbo.languages AS t USING (SELECT @code AS code) AS s ON t.code = s.code
        WHEN MATCHED THEN UPDATE SET name_native = @name
        WHEN NOT MATCHED THEN INSERT (code, name_native) VALUES (@code, @name);`);
      for (const gender of ["female", "male"]) {
        await req().input("code", sql.VarChar, code).input("gender", sql.VarChar, gender).query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.voices WHERE language_code = @code AND gender = @gender)
            INSERT INTO dbo.voices (language_code, name, gender) VALUES (@code, CONCAT(@code, '-', @gender), @gender);`);
      }
    }
    log(`✔ ${PLANS.length} gói, ${LANGUAGES.length} ngôn ngữ, ${LANGUAGES.length * 2} giọng đọc`);

    const passwordHash = await bcrypt.hash(env.SEED_PASSWORD, 10);
    const userIds: number[] = [];
    for (const u of DEMO_USERS) {
      const res = await req()
        .input("email", sql.NVarChar, u.email)
        .input("name", sql.NVarChar, u.fullName)
        .input("role", sql.VarChar, u.role)
        .input("plan", sql.NVarChar, u.plan)
        .input("hash", sql.NVarChar, passwordHash).query<{ id: number }>(`
          IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = @email)
            INSERT INTO dbo.users (email, password_hash, full_name, role, plan_id)
            SELECT @email, @hash, @name, @role, id FROM dbo.plans WHERE name = @plan;
          SELECT id FROM dbo.users WHERE email = @email;`);
      userIds.push(res.recordset[0]!.id);
    }
    log(`✔ ${DEMO_USERS.length} tài khoản mẫu (mật khẩu: SEED_PASSWORD trong .env)`);

    // ~30 Job lịch sử trải trong 7 ngày gần nhất để dashboard có dữ liệu biểu đồ.
    const hasJobs = (await req().query<{ n: number }>("SELECT COUNT(*) AS n FROM dbo.jobs")).recordset[0]!.n > 0;
    if (!hasJobs) {
      const rand = rng(2026);
      const codes = LANGUAGES.map(([c]) => c).filter((c) => c !== "vi");
      const regularUsers = userIds.slice(1);
      for (let i = 0; i < 30; i++) {
        const userId = regularUsers[Math.floor(rand() * regularUsers.length)]!;
        const daysAgo = Math.floor(rand() * 7);
        const minutesAgo = daysAgo * 1440 + Math.floor(rand() * 600);
        const isVideo = rand() < 0.75;
        const durationSec = 60 + Math.floor(rand() * 900);
        const targets = [...codes].sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * 3));
        const roll = rand();
        const jobStatus = roll < 0.75 ? "COMPLETED" : roll < 0.9 ? "PARTIALLY_COMPLETED" : "FAILED";

        const up = await req()
          .input("user", sql.Int, userId)
          .input("file", sql.NVarChar, `bai-giang-${i + 1}.${isVideo ? "mp4" : "mp3"}`)
          .input("size", sql.BigInt, 5_000_000 + Math.floor(rand() * 200_000_000))
          .input("mime", sql.VarChar, isVideo ? "video/mp4" : "audio/mpeg")
          .input("dur", sql.Int, durationSec)
          .input("ago", sql.Int, minutesAgo).query<{ id: number }>(`
            INSERT INTO dbo.uploads (user_id, file_name, size_bytes, mime_type, duration_sec, chunk_size,
                                     total_chunks, status, expires_at, created_at)
            OUTPUT inserted.id
            VALUES (@user, @file, @size, @mime, @dur, 5242880, CEILING(@size / 5242880.0), 'COMPLETED',
                    DATEADD(DAY, 1, SYSUTCDATETIME()), DATEADD(MINUTE, -@ago, SYSUTCDATETIME()));`);

        const job = await req()
          .input("user", sql.Int, userId)
          .input("upload", sql.Int, up.recordset[0]!.id)
          .input("media", sql.VarChar, isVideo ? "video" : "audio")
          .input("status", sql.VarChar, jobStatus)
          .input("ago", sql.Int, minutesAgo).query<{ id: number }>(`
            INSERT INTO dbo.jobs (user_id, upload_id, source_language, detected_language, media_type, voice_gender,
                                  status, created_at, updated_at)
            OUTPUT inserted.id
            VALUES (@user, @upload, 'auto', 'vi', @media, 'female', @status,
                    DATEADD(MINUTE, -@ago, SYSUTCDATETIME()), DATEADD(MINUTE, -@ago + 5, SYSUTCDATETIME()));`);

        for (const [k, lang] of targets.entries()) {
          const failed = jobStatus === "FAILED" || (jobStatus === "PARTIALLY_COMPLETED" && k === 0);
          await req()
            .input("job", sql.Int, job.recordset[0]!.id)
            .input("lang", sql.VarChar, lang)
            .input("status", sql.VarChar, failed ? "FAILED" : "COMPLETED")
            .input("progress", sql.TinyInt, failed ? 40 : 100)
            .input("err", sql.VarChar, failed ? "TTS_FAILED" : null).query(`
              INSERT INTO dbo.job_targets (job_id, language_code, status, progress, sequence, error_code)
              VALUES (@job, @lang, @status, @progress, 10, @err);`);
        }
      }
      log("✔ 30 Job lịch sử trong 7 ngày gần nhất");
    }
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    await pool.close();
  }
}

// Chạy trực tiếp: npm run db:seed
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  seed().catch((err: unknown) => {
    console.error(`Seed thất bại: ${(err as Error).message}`);
    process.exit(1);
  });
}
