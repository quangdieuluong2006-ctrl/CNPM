// Demo "làm sao biết có 4 user đang hoạt động?" khi chưa có giao diện Web Admin.
// Cách chạy (API phải đang chạy bằng `npm run dev` ở một terminal khác):
//   npm run demo:presence          → 4 user lần lượt đăng nhập rồi thoát
//   npm run demo:presence -- 6     → số user tùy chọn (tối đa 6 tài khoản mẫu)
//   npm run demo:presence -- 4 --giu → giữ các user online cho tới khi nhấn Ctrl+C (để giải thích, chạy SQL)
import { io, type Socket } from "socket.io-client";

const API = process.env.DEMO_API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
const PASSWORD = process.env.SEED_PASSWORD ?? "Demo@12345";
const args = process.argv.slice(2);
const KEEP_ONLINE = args.includes("--giu");
const N = Math.min(Math.max(Number(args.find((a) => /^\d+$/.test(a)) ?? 4), 1), 6);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const emailById = new Map<number, string>();

async function login(email: string, clientType: "admin" | "web" | "mobile"): Promise<string> {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD, clientType }),
  });
  if (!res.ok) throw new Error(`Đăng nhập ${email} thất bại: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { accessToken: string; user: { id: number } };
  emailById.set(body.user.id, email);
  return body.accessToken;
}

function connect(token: string, clientType: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const s = io(API, { auth: { token }, query: { clientType }, transports: ["websocket"] });
    s.once("presence.session", () => resolve(s));
    s.once("connect_error", reject);
  });
}

async function printList(adminToken: string) {
  const res = await fetch(`${API}/api/v1/admin/presence`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const body = (await res.json()) as { activeUsers: number; users: { fullName: string; email: string; clientTypes: string[]; openSessions: number }[] };
  console.log(`\n  GET /admin/presence → Đang hoạt động: ${body.activeUsers}`);
  console.table(body.users.map((u) => ({ "Họ tên": u.fullName, Email: u.email, Client: u.clientTypes.join(","), "Số phiên": u.openSessions })));
}

async function main() {
  console.log(`API: ${API}`);
  const adminToken = await login("admin@demo.vn", "admin");
  const admin = await connect(adminToken, "admin");
  admin.on("presence.update", (p: { activeUsers: number; changed?: { userId: number; type: string } }) => {
    const who = p.changed ? (emailById.get(p.changed.userId) ?? `user #${p.changed.userId}`) : "";
    const c = p.changed ? ` – ${who} ${p.changed.type === "online" ? "đang trực tuyến" : "đã ngoại tuyến"}` : "";
    console.log(`  [Web Admin nhận presence.update] Đang hoạt động: ${p.activeUsers}${c}`);
  });
  console.log("Admin đã kết nối, đang lắng nghe presence.update…\n");

  const users: Socket[] = [];
  for (let i = 1; i <= N; i++) {
    const email = `user${i}@demo.vn`;
    const clientType = i % 2 === 0 ? "mobile" : "web";
    console.log(`→ ${email} đăng nhập trên ${clientType}`);
    users.push(await connect(await login(email, clientType), clientType));
    await sleep(1200);
  }
  await printList(adminToken);

  console.log("\n→ user1 mở thêm một tab: số người không đổi, số phiên của user1 tăng");
  users.push(await connect(await login("user1@demo.vn", "web"), "web"));
  await sleep(1200);
  await printList(adminToken);

  if (KEEP_ONLINE) {
    // Giữ kết nối: Socket.IO tự trả lời ping nội bộ, nhưng nhịp tim presence phải tự gửi mỗi 30 giây
    const ping = setInterval(() => [...users, admin].forEach((s) => s.emit("presence.ping", {})), 30_000);
    console.log("\nĐang giữ các user online. Thử chạy trong SSMS: SELECT * FROM dbo.v_active_users;");
    console.log("Nhấn Ctrl+C để các user lần lượt thoát.");
    await new Promise<void>((resolve) => process.once("SIGINT", () => resolve()));
    clearInterval(ping);
  }

  console.log("\n→ Lần lượt đóng kết nối");
  for (const s of users.reverse()) {
    s.disconnect();
    await sleep(1000);
  }
  admin.disconnect();
  console.log("\nXong. Có thể kiểm tra trực tiếp bằng SQL: SELECT * FROM dbo.v_active_users;");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
