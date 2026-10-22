# API – Backend Node.js + SQL Server

Backend của hệ thống Thuyết minh tự động đa ngôn ngữ (PRD v3.0, mục 7.7, 8, 9).

## Yêu cầu

- Node.js 22 LTS
- Docker Desktop (để chạy SQL Server 2022). Mac chip Apple: bật "Use Rosetta" trong Docker Desktop.

## Chạy lần đầu

```bash
# Ở thư mục gốc repo
cp .env.example .env                 # đổi DB_PASSWORD (≥ 8 ký tự, có hoa, thường, số, ký tự đặc biệt)
docker compose up -d sqlserver       # chờ khoảng 20 giây cho SQL Server sẵn sàng

cd api
cp .env.example .env                 # DB_PASSWORD phải trùng với .env ở thư mục gốc
npm ci
npm run db:migrate                   # tạo CSDL ThuyetMinhDB và chạy db/migrations/*.sql
npm run db:seed                      # gói, ngôn ngữ, 1 admin + 6 user mẫu, 30 Job lịch sử
npm run dev                          # http://localhost:3000/health
```

Tài khoản mẫu: `admin@demo.vn`, `user1@demo.vn` … `user6@demo.vn`, mật khẩu là `SEED_PASSWORD` trong `api/.env` (chỉ dùng ở môi trường dev).

## Lệnh

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy API, tự tải lại khi sửa code |
| `npm run db:migrate` | Chạy các migration chưa chạy (ghi vào bảng `schema_migrations`) |
| `npm run db:seed` | Nạp dữ liệu mẫu (chạy lại nhiều lần vẫn an toàn) |
| `npm run typecheck` · `npm run lint` | Kiểm tra kiểu · kiểm tra mã |
| `npm test` | Test đơn vị |
| `RUN_DB_TESTS=1 npm test` | Thêm test tích hợp trên SQL Server (dùng CSDL riêng `ThuyetMinhDB_test`) |
| `npm run build` · `npm start` | Build ra `dist/` · chạy bản build |

## Quy tắc khi sửa cơ sở dữ liệu

- **Không sửa** migration đã merge; thay đổi mới viết thành tệp mới `db/migrations/00X_mo_ta.sql`.
- Tách các khối lệnh bằng dòng `GO` (giống SSMS). Đầu mỗi tệp giữ `SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;` vì filtered index và view cần hai tùy chọn này.
- Truy vấn trong code luôn dùng tham số (`request.input(...)`), không nối chuỗi.

## Kiểm tra nhanh "người dùng đang hoạt động" bằng SQL

```sql
SELECT * FROM dbo.v_active_users WHERE role = 'user';
EXEC dbo.sp_admin_dashboard_stats;
```

## API xác thực (FE-01)

Mọi endpoint nghiệp vụ nằm dưới `/api/v1`. Body gửi `clientType` là `web` (mặc định), `admin` hoặc `mobile`.

| Endpoint | Mô tả | Lỗi thường gặp |
|---|---|---|
| `POST /auth/register` | `{email, password, fullName, locale?, clientType?}` → 201 | 409 `EMAIL_TAKEN`, 400 `VALIDATION_ERROR` |
| `POST /auth/login` | `{email, password, clientType?}` → `{accessToken, expiresIn, user, …}` | 401 `AUTH_INVALID_CREDENTIALS`, 403 `ACCOUNT_LOCKED`, 403 `FORBIDDEN` (user thường vào Admin), 429 `RATE_LIMITED` |
| `POST /auth/refresh` | Cấp access token mới, **xoay vòng** refresh token | 401 `AUTH_REFRESH_INVALID`, 403 `CSRF_INVALID` |
| `POST /auth/logout` | Thu hồi refresh token → 204 | |
| `GET /me` | Hồ sơ + gói, cần `Authorization: Bearer <accessToken>` | 401 `AUTH_REQUIRED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` |

Cách client giữ phiên:

- **Web User / Web Admin**: refresh token nằm trong cookie HttpOnly `rt_web` / `rt_admin` (JavaScript không đọc được). Response trả `csrfToken` (cũng có trong cookie `csrf_web` / `csrf_admin`); khi gọi `/auth/refresh` và `/auth/logout` phải gửi header `X-CSRF-Token` với giá trị này và bật `credentials: "include"` (fetch) hoặc `withCredentials: true` (axios).
- **Mobile**: response trả `refreshToken` trong body; lưu bằng `expo-secure-store`, gửi lại trong body `{clientType: "mobile", refreshToken}`.
- Access token (15 phút) chỉ giữ trong bộ nhớ. Gặp 401 `AUTH_TOKEN_EXPIRED` thì gọi `/auth/refresh` **một lần** cho mọi request đang chờ.
- Refresh token đã thu hồi mà bị dùng lại → hệ thống coi là bị đánh cắp, thu hồi mọi phiên của user đó (ghi `auth.refresh_reuse` vào `activity_logs`).

Thử nhanh bằng curl:

```bash
curl -X POST localhost:3000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"user1@demo.vn","password":"Demo@12345","clientType":"mobile"}'
curl localhost:3000/api/v1/me -H "Authorization: Bearer <accessToken>"
```

## Người dùng đang hoạt động – presence (FE-12, PRD mục 3.7)

**Định nghĩa:** một user "đang hoạt động" khi có ít nhất một phiên trong `user_sessions` **chưa đóng** và có nhịp tim trong **60 giây** gần nhất. Một user mở nhiều tab/thiết bị vẫn tính **1** (view `dbo.v_active_users` gom theo user).

**Cơ chế:**

1. Client đăng nhập xong thì mở Socket.IO: `io(API_URL, { auth: { token: accessToken }, query: { clientType } })` → server **INSERT** một dòng `user_sessions` và gửi lại `presence.session { sessionId }`.
2. Mỗi **30 giây** client gửi `socket.emit("presence.ping", {})` → server **UPDATE** `last_seen_at`.
3. Đóng tab / đăng xuất → sự kiện `disconnect` → server ghi `disconnected_at`.
4. Mất mạng đột ngột không có `disconnect` → tác vụ dọn phiên chạy mỗi 30 giây, đóng phiên quá 60 giây không có nhịp tim.
5. Sau mỗi thay đổi, server đếm lại từ view và phát `presence.update { activeUsers, activeUsersAll, changed: { userId, type }, ts }` tới phòng `admins` (chỉ socket Web Admin của tài khoản admin).
6. Socket.IO không kết nối được → gọi `POST /api/v1/presence/heartbeat { clientType }` mỗi 30 giây (dự phòng).

**API cho Web Admin** (cần token admin, user thường nhận 403):

| Endpoint | Trả về |
|---|---|
| `GET /admin/presence?role=user\|all&clientType=web\|mobile\|admin` | `{ count, activeUsers, activeUsersAll, users: [{ userId, fullName, email, role, clientTypes, openSessions, onlineSince, lastSeenAt }] }` |
| `GET /admin/stats` | `{ totalUsers, activeUsers, dailyActiveUsers, jobsToday, jobsProcessing, jobsFailedToday, jobsByDay[7], targetLanguages[] }` |

**Trình diễn nhanh** (không cần giao diện): chạy `npm run dev` ở một terminal, rồi ở terminal khác chạy `npm run demo:presence`. Script cho 4 user lần lượt kết nối, in ra số Web Admin nhận được theo thời gian thực và bảng `GET /admin/presence`, rồi lần lượt thoát.
