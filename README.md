# Thuyết minh tự động đa ngôn ngữ

Đồ án môn Công nghệ phần mềm: hệ thống full-stack gồm Backend Node.js + SQL Server, Web User, Web Admin (React.js) và Mobile (React Native). Người dùng tải video lên, chọn ngôn ngữ đích, theo dõi tiến trình và nhận kết quả lồng tiếng.

**Bản demo web:** https://cnpm-pied.vercel.app

## Thành viên nhóm

| Họ tên           | MSSV       | Phụ trách       |
| ---------------- | ---------- | --------------- |
| Lương DIệu Quang | 3124411246 | Web             |
| Võ Thị Ngọc Như      | 3124411207 | Mobile          |
| Tăng Gia Bảo     | 3124411035   | Tài liệu, CI/CD |

## Thành phần hệ thống

| Thư mục | Thành phần | Công nghệ |
|---|---|---|
| `api/` | Backend REST + realtime | Node.js 22, Express 5, TypeScript, Socket.IO |
| `db/` | Cơ sở dữ liệu: migration, view, stored procedure | **SQL Server 2022** |
| `admin/` | **Web Admin**: thống kê, người dùng đang hoạt động | React 19, Vite 8, TypeScript, TanStack Query, Tailwind CSS, Recharts |
| `web/` | Web User: tải lên, chọn ngôn ngữ, tiến trình, kết quả | React 19, Vite |
| `mobile/` | Ứng dụng Mobile | React Native, Expo SDK 57, TypeScript |

Tài liệu đặc tả: **PRD v3.0** (Backend + SQL Server, Web User, Web Admin, Mobile, presence).

## Đã hoàn thành

- **CSDL SQL Server**: 14 bảng, view `v_active_users`, thủ tục `sp_admin_dashboard_stats`, migration + dữ liệu mẫu
- **Xác thực**: đăng ký, đăng nhập, refresh token xoay vòng, đăng xuất, phân quyền user/admin, khóa tài khoản
- **Người dùng đang hoạt động (presence)**: Socket.IO + nhịp tim 30 giây + bảng `user_sessions`; Web Admin thấy số người online theo thời gian thực
- **Web Admin**: Dashboard 6 chỉ số + biểu đồ, trang Người dùng đang hoạt động

## Cách chạy nhanh (Windows)

1. **SQL Server 2022** đang chạy, bật đăng nhập `sa` và TCP/IP cổng 1433 (hoặc dùng `docker compose up -d sqlserver`).
2. **API**: `cd api` → `copy .env.example .env` (sửa `DB_PASSWORD`) → `npm install` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`
3. **Web User**: `cd web` → `npm install` → `npm run dev` → http://localhost:5173
4. **Web Admin**: `cd admin` → `npm install` → `npm run dev` → http://localhost:5174, đăng nhập `admin@demo.vn` / `Demo@12345`

Tài liệu API (Swagger): **http://localhost:3000/api/docs** – xem và gọi thử mọi endpoint.

Chi tiết: `api/README.md`, `web/README.md`, `admin/README.md`.

## Kịch bản demo: "Làm sao biết có 4 người dùng đang hoạt động?"

**Cách 1 – người thật quét mã QR** (thuyết phục nhất):

1. Chạy đủ API, Web User, Web Admin như trên. Laptop và điện thoại của các bạn dùng **cùng một mạng Wi-Fi**
   (Wi-Fi trường thường chặn các máy nhìn thấy nhau → phát Wi-Fi từ điện thoại của mình cho chắc).
2. Mở cổng 5173 trên Windows Firewall (chỉ làm một lần, PowerShell **Run as administrator**):
   ```powershell
   New-NetFirewallRule -DisplayName "Thuyet minh - Web User 5173" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
   ```
   Nếu Windows hiện hộp thoại "Allow access" cho Node.js thì bấm **Allow**.
3. Web Admin → **Người dùng đang hoạt động** → **Mời tham gia (QR)** → chiếu mã QR (chọn đúng mạng Wi-Fi nếu có nhiều mạng).
4. 4 bạn quét mã → trang Đăng ký mở trên điện thoại → tạo tài khoản → số trên Web Admin tăng 1 → 4 ngay lập tức.
5. Kiểm chứng trong SSMS: `SELECT * FROM dbo.v_active_users;` và `SELECT * FROM dbo.users ORDER BY id DESC;`

**Cách 2 – script mô phỏng** (khi không có điện thoại): `cd api` → `npm run demo:presence -- 4 --giu`
(4 tài khoản mẫu vào và **ở lại** tới khi nhấn Ctrl+C).

**Giải thích cơ chế:** mỗi kết nối Socket.IO ghi một dòng `user_sessions`; client gửi nhịp tim 30 giây cập nhật `last_seen_at`;
"đang hoạt động" = phiên chưa đóng và có nhịp tim trong 60 giây; đếm `DISTINCT user_id` (view `v_active_users`), nên một người
mở nhiều tab vẫn tính 1; thoát → `disconnected_at`; mất mạng → tác vụ dọn phiên đóng sau 60 giây; mỗi thay đổi đẩy `presence.update`
tới Web Admin.

## Cấu trúc thư mục

```
CNPM/
├── api/       # Backend Node.js + Express + Socket.IO
├── db/        # migration SQL Server
├── admin/     # Web Admin (React + Vite + TypeScript)
├── web/       # Web User (React + Vite)
├── mobile/    # Ứng dụng mobile (React Native + Expo)
└── .github/   # CI (GitHub Actions)
```

## Cách chạy

Yêu cầu: cài [Git](https://git-scm.com) và [Node.js](https://nodejs.org) (bản LTS).

```bash
git clone https://github.com/quangdieuluong2006-ctrl/CNPM.git
```

**Web**

```bash
cd CNPM/web
npm install
npm run dev
```

Mở http://localhost:5173

**Mobile**

```bash
cd CNPM/mobile
npm install
npx expo start
```

Quét mã QR bằng app Expo Go (cần tài khoản Expo, đăng nhập bằng `npx expo login`). Nếu điện thoại và máy tính không cùng mạng Wi-Fi thì dùng `npx expo start --tunnel`.

## Quy trình làm việc

- Không code trực tiếp lên `main` hay `develop`; mỗi tính năng làm trên một nhánh riêng tạo từ `develop` (ví dụ `feature/FE-12-presence`).
- Làm xong thì mở Pull Request vào **`develop`**, CI tự chạy kiểm tra, **thành viên còn lại review và Approve** rồi mới gộp.
- Khi chốt bản để báo cáo/phát hành: mở Pull Request `develop` → `main`. Gộp vào `main` thì Vercel tự cập nhật bản web.
- Commit theo Conventional Commits: `feat(...)`, `fix(...)`, `test(...)`, `docs(...)`.

## Tài liệu

- [PRD](PRD_Thuyet_Minh_Da_Ngon_Ngu_FrontEnd.docx)
- [Use case và Sequence](docs/UseCase_Sequence.docx)
