# Web Admin – React + Vite (TypeScript)

Trang quản trị của hệ thống Thuyết minh đa ngôn ngữ (PRD v3.0: FE-09 Dashboard, FE-12 Người dùng đang hoạt động).

## Chạy khi phát triển

Cần API đang chạy ở `http://localhost:3000` (xem `api/README.md`).

```bash
cd admin
npm install
npm run dev        # mở http://localhost:5174
```

Đăng nhập bằng `admin@demo.vn` / `Demo@12345` (tài khoản mẫu tạo bởi `npm run db:seed` của API).
Tài khoản vai trò `user` sẽ bị từ chối với thông báo "Tài khoản không có quyền quản trị".

Vite chuyển tiếp `/api` và `/socket.io` sang API (cấu hình trong `vite.config.ts`), nên trình duyệt coi như cùng nguồn:
cookie `rt_admin` hoạt động, không cần cấu hình CORS. Đổi địa chỉ API bằng biến `API_PROXY_TARGET` trong `.env.local`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy dev server cổng 5174 |
| `npm run typecheck` · `npm run lint` | Kiểm tra kiểu · kiểm tra mã |
| `npm test` | Test (Vitest + jsdom) |
| `npm run build` | Build ra `dist/` |

## Cấu trúc

```
src/
├─ lib/api.ts                 # gọi API: token trong bộ nhớ, tự làm mới token (single-flight), ApiError
├─ features/auth/             # AuthProvider: đăng nhập, khôi phục phiên khi tải lại trang, đăng xuất
├─ features/realtime/         # RealtimeProvider: Socket.IO, nhịp tim 30 giây, nhận presence.update
├─ pages/DashboardPage.tsx    # FE-09: 6 thẻ thống kê, biểu đồ Job 7 ngày, ngôn ngữ đích
├─ pages/ActiveUsersPage.tsx  # FE-12: số và danh sách người dùng đang hoạt động (realtime)
└─ pages/LoginPage.tsx
```

## Thẻ "Đang hoạt động" cập nhật thế nào?

Khi một người dùng mở/đóng ứng dụng, API ghi bảng `user_sessions` rồi phát sự kiện `presence.update` tới phòng `admins`.
`RealtimeProvider` nhận sự kiện, cập nhật số ngay và tải lại `GET /admin/presence`, `GET /admin/stats`.
Nếu mất Socket.IO, trang tự gọi lại API mỗi 10 giây và hiện banner "Mất kết nối realtime".
