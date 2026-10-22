import { NavLink, Outlet } from "react-router";
import { useAuth } from "../features/auth/AuthProvider";
import { useRealtime } from "../features/realtime/RealtimeProvider";

const navItems = [
  { to: "/", label: "Tổng quan", end: true },
  { to: "/active-users", label: "Người dùng đang hoạt động", end: false },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { connected } = useRealtime();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-slate-900 text-slate-100">
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-400">Thuyết minh đa ngôn ngữ</p>
          <p className="text-lg font-semibold">Web Admin</p>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <span className={`inline-flex items-center gap-2 text-sm ${connected ? "text-emerald-700" : "text-amber-700"}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`} />
            {connected ? "Realtime đã kết nối" : "Mất kết nối realtime – đang thử lại"}
          </span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">
              {user?.fullName} <span className="text-slate-400">({user?.email})</span>
            </span>
            <button onClick={() => void logout()} className="rounded-md border px-3 py-1.5 hover:bg-slate-100">
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
