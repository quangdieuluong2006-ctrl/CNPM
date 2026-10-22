import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "../components/StatCard";
import { useRealtime } from "../features/realtime/RealtimeProvider";
import { apiGet } from "../lib/api";
import { shortDay } from "../lib/format";
import type { StatsResponse } from "../lib/types";

const PIE_COLORS = ["#0f766e", "#2563eb", "#9333ea", "#ea580c", "#ca8a04", "#64748b", "#db2777", "#16a34a", "#0891b2", "#7c3aed"];

// FE-09: Dashboard quản trị
export function DashboardPage() {
  const { last } = useRealtime();
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet<StatsResponse>("/admin/stats"),
    refetchInterval: 60_000, // thống kê tự làm mới mỗi 60 giây
  });

  if (stats.isPending) return <p className="text-slate-500">Đang tải thống kê…</p>;
  if (stats.isError)
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Không tải được thống kê: {stats.error.message}{" "}
        <button className="underline" onClick={() => void stats.refetch()}>
          Thử lại
        </button>
      </div>
    );

  const s = stats.data;
  // Thẻ "Đang hoạt động" lấy số realtime từ presence.update nếu có, nhanh hơn chờ tải lại thống kê
  const activeNow = last?.activeUsers ?? s.activeUsers;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tổng quan hệ thống</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Tổng người dùng" value={s.totalUsers} />
        <Link to="/active-users" className="block">
          <StatCard label="Đang hoạt động" value={activeNow} highlight hint="Cập nhật theo thời gian thực – bấm để xem danh sách" />
        </Link>
        <StatCard label="Hoạt động hôm nay" value={s.dailyActiveUsers} hint="Số user khác nhau có phiên trong ngày (giờ Việt Nam)" />
        <StatCard label="Job hôm nay" value={s.jobsToday} />
        <StatCard label="Job đang xử lý" value={s.jobsProcessing} />
        <StatCard label="Job thất bại hôm nay" value={s.jobsFailedToday} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-medium text-slate-800">Số Job 7 ngày gần nhất</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.jobsByDay.map((d) => ({ ...d, label: shortDay(d.day) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [v, "Job"]} />
                <Bar dataKey="jobs" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-medium text-slate-800">Ngôn ngữ đích (30 ngày)</h2>
          <div className="h-64">
            {s.targetLanguages.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={s.targetLanguages} dataKey="count" nameKey="name" outerRadius={90}>
                    {s.targetLanguages.map((l, i) => (
                      <Cell key={l.code} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
