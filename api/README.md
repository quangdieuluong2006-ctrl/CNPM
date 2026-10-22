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
