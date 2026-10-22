import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { migrate } from "../src/db/migrate.js";
import { closePool, dbConfig, getPool, sql } from "../src/db/pool.js";
import { seed } from "../src/db/seed.js";

// Chạy: RUN_DB_TESTS=1 DB_PASSWORD=... npm test  (cần SQL Server đang chạy)
describe.skipIf(process.env.RUN_DB_TESTS !== "1")("SQL Server – migration, seed, presence", () => {
  beforeAll(async () => {
    const master = await new sql.ConnectionPool(dbConfig("master")).connect();
    await master.request().batch(`
      IF DB_ID('ThuyetMinhDB_test') IS NOT NULL
      BEGIN
        ALTER DATABASE ThuyetMinhDB_test SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE ThuyetMinhDB_test;
      END`);
    await master.close();
    await migrate(() => {});
    await seed(() => {});
  }, 120_000);

  afterAll(async () => {
    await closePool();
  });

  it("chạy migration lần hai không làm gì thêm", async () => {
    expect(await migrate(() => {})).toEqual([]);
  });

  it("seed chạy lại vẫn an toàn (không nhân đôi dữ liệu)", async () => {
    await seed(() => {});
    const pool = await getPool();
    const r = await pool.request().query<{ users: number; jobs: number }>(
      "SELECT (SELECT COUNT(*) FROM dbo.users) AS users, (SELECT COUNT(*) FROM dbo.jobs) AS jobs",
    );
    expect(r.recordset[0]).toEqual({ users: 7, jobs: 30 });
  });

  it("đếm đúng 4 người dùng đang hoạt động (TC-34)", async () => {
    const pool = await getPool();
    const ids = (
      await pool.request().query<{ id: number; email: string }>("SELECT id, email FROM dbo.users ORDER BY id")
    ).recordset.reduce<Record<string, number>>((m, u) => ({ ...m, [u.email]: u.id }), {});

    const add = (email: string, client: string, secondsAgo: number, disconnected = false) =>
      pool
        .request()
        .input("u", sql.Int, ids[email])
        .input("c", sql.VarChar, client)
        .input("ago", sql.Int, secondsAgo)
        .input("dc", sql.Bit, disconnected).query(`
          INSERT INTO dbo.user_sessions (user_id, client_type, last_seen_at, disconnected_at)
          VALUES (@u, @c, DATEADD(SECOND, -@ago, SYSUTCDATETIME()),
                  CASE WHEN @dc = 1 THEN SYSUTCDATETIME() END);`);

    await add("admin@demo.vn", "admin", 0);
    await add("user1@demo.vn", "web", 0);
    await add("user1@demo.vn", "web", 20); // tab thứ hai: không được đếm thêm
    await add("user2@demo.vn", "web", 10);
    await add("user3@demo.vn", "mobile", 0);
    await add("user4@demo.vn", "web", 45);
    await add("user5@demo.vn", "web", 120); // mất mạng: nhịp tim quá 60 giây
    await add("user6@demo.vn", "web", 0, true); // đã đăng xuất

    const active = await pool
      .request()
      .query<{ n: number }>("SELECT COUNT(*) AS n FROM dbo.v_active_users WHERE role = 'user'");
    expect(active.recordset[0]!.n).toBe(4);

    const user1 = await pool
      .request()
      .input("u", sql.Int, ids["user1@demo.vn"])
      .query<{ open_sessions: number }>("SELECT open_sessions FROM dbo.v_active_users WHERE user_id = @u");
    expect(user1.recordset[0]!.open_sessions).toBe(2);

    const stats = await pool.request().execute<{ total_users: number; active_users: number }>(
      "dbo.sp_admin_dashboard_stats",
    );
    expect(stats.recordset[0]).toMatchObject({ total_users: 6, active_users: 4 });
  });

  it("GET /health/ready báo đã kết nối CSDL", async () => {
    const res = await request(createApp()).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ready", database: "ok", migrations: 2 });
  });
});
