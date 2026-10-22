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

1. SQL Server 2022 đang chạy, bật đăng nhập `sa` và TCP/IP cổng 1433 (hoặc dùng `docker compose up -d sqlserver`).
2. API: `cd api` → `copy .env.example .env` (sửa `DB_PASSWORD`) → `npm install` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`
3. Web Admin: `cd admin` → `npm install` → `npm run dev` → mở http://localhost:5174, đăng nhập `admin@demo.vn` / `Demo@12345`
4. Trình diễn 4 người dùng đang hoạt động: `cd api` → `npm run demo:presence`

Chi tiết: `api/README.md`, `admin/README.md`.

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
