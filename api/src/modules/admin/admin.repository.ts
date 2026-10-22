import { getPool } from "../../db/pool.js";

export interface DashboardStats {
  total_users: number;
  active_users: number;
  daily_active_users: number;
  jobs_today: number;
  jobs_processing: number;
  jobs_failed_today: number;
}

export async function dashboardStats(): Promise<DashboardStats> {
  const pool = await getPool();
  const r = await pool.request().execute<DashboardStats>("dbo.sp_admin_dashboard_stats");
  return r.recordset[0]!;
}

// Số Job mỗi ngày trong 7 ngày gần nhất, ngày tính theo giờ Việt Nam.
export async function jobsLast7Days(): Promise<{ day: string; jobs: number }[]> {
  const pool = await getPool();
  const r = await pool.request().query<{ day: Date; jobs: number }>(`
    DECLARE @todayLocal DATE = CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time' AS DATE);
    DECLARE @fromUtc DATETIME2(0) = CAST(CAST(DATEADD(DAY, -6, @todayLocal) AS DATETIME2(0))
            AT TIME ZONE 'SE Asia Standard Time' AT TIME ZONE 'UTC' AS DATETIME2(0));
    SELECT CAST(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time' AS DATE) AS day,
           COUNT(*) AS jobs
    FROM dbo.jobs
    WHERE created_at >= @fromUtc AND deleted_at IS NULL
    GROUP BY CAST(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time' AS DATE);`);
  const byDay = new Map(r.recordset.map((x) => [x.day.toISOString().slice(0, 10), x.jobs]));

  // Điền đủ 7 ngày (ngày không có Job = 0) để biểu đồ không bị thiếu cột.
  const todayVn = new Date(Date.now() + 7 * 3600_000);
  const out: { day: string; jobs: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(todayVn.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ day, jobs: byDay.get(day) ?? 0 });
  }
  return out;
}

// Phân bố ngôn ngữ đích (biểu đồ tròn FE-09), 30 ngày gần nhất.
export async function targetLanguageShare(): Promise<{ code: string; name: string; count: number }[]> {
  const pool = await getPool();
  const r = await pool.request().query<{ code: string; name: string; count: number }>(`
    SELECT t.language_code AS code, l.name_native AS name, COUNT(*) AS count
    FROM dbo.job_targets t
    JOIN dbo.jobs j ON j.id = t.job_id
    JOIN dbo.languages l ON l.code = t.language_code
    WHERE j.deleted_at IS NULL AND j.created_at >= DATEADD(DAY, -30, SYSUTCDATETIME())
    GROUP BY t.language_code, l.name_native
    ORDER BY count DESC;`);
  return r.recordset;
}
