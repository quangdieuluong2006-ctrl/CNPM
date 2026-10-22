import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { clientTypeSchema } from "../auth/auth.schemas.js";
import * as presenceRepo from "../presence/presence.repository.js";
import * as adminRepo from "./admin.repository.js";

// Mọi route /admin/* yêu cầu đăng nhập và vai trò admin (PRD v3.0, mục 11.1).
export const adminRouter = Router();
adminRouter.use("/admin", requireAuth, requireRole("admin"));

// FE-09: 6 thẻ thống kê + biểu đồ 7 ngày + phân bố ngôn ngữ đích.
adminRouter.get("/admin/stats", async (_req, res) => {
  const [s, jobsByDay, targetLanguages] = await Promise.all([
    adminRepo.dashboardStats(),
    adminRepo.jobsLast7Days(),
    adminRepo.targetLanguageShare(),
  ]);
  res.json({
    totalUsers: s.total_users,
    activeUsers: s.active_users,
    dailyActiveUsers: s.daily_active_users,
    jobsToday: s.jobs_today,
    jobsProcessing: s.jobs_processing,
    jobsFailedToday: s.jobs_failed_today,
    jobsByDay,
    targetLanguages,
  });
});

const presenceQuery = z.object({
  role: z.enum(["user", "all"]).default("user"),
  clientType: clientTypeSchema.optional(),
});

// FE-12: số và danh sách người dùng đang hoạt động (đọc từ view v_active_users).
adminRouter.get("/admin/presence", async (req, res) => {
  const q = presenceQuery.parse(req.query);
  const [rows, counts] = await Promise.all([
    presenceRepo.listActiveUsers({ role: q.role === "all" ? undefined : "user", clientType: q.clientType }),
    presenceRepo.countActiveUsers(),
  ]);
  res.json({
    count: rows.length, // số theo bộ lọc đang chọn
    activeUsers: counts.activeUsers, // chỉ vai trò user
    activeUsersAll: counts.activeUsersAll,
    users: rows.map((r) => ({
      userId: r.user_id,
      fullName: r.full_name,
      email: r.email,
      role: r.role,
      clientTypes: (["web", "mobile", "admin"] as const).filter((c) => r[`on_${c}`] === 1),
      openSessions: r.open_sessions,
      onlineSince: r.online_since,
      lastSeenAt: r.last_seen_at,
    })),
    ts: new Date().toISOString(),
  });
});
