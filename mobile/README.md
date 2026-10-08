# Thuyết minh tự động đa ngôn ngữ (Frontend)

Đồ án môn Công nghệ phần mềm, hướng Frontend: giao diện Web (React.js) và Mobile (React Native). Người dùng tải video lên, chọn ngôn ngữ đích, theo dõi tiến trình và nhận kết quả lồng tiếng.

**Bản demo web:** https://cnpm-pied.vercel.app

## Thành viên nhóm

| Họ tên     | MSSV        | Phụ trách       |
| ---------- | ----------- | --------------- |
| (điền tên) | (điền MSSV) | Web             |
| (điền tên) | (điền MSSV) | Mobile          |
| (điền tên) | (điền MSSV) | Tài liệu, CI/CD |

## Chức năng hiện có

Luồng chính gồm 4 màn hình, chạy trên cả web và mobile:

1. **Tải lên**: chọn video hoặc audio cần lồng tiếng
2. **Chọn ngôn ngữ**: chọn một hoặc nhiều ngôn ngữ đích
3. **Tiến trình**: theo dõi phần trăm xử lý
4. **Kết quả**: xem và tải bản đã lồng tiếng (web)

> Hiện tại phần xử lý dùng dữ liệu giả (mock) vì chưa nối với Backend. Khi có API thật sẽ thay thế.

## Công nghệ

- Web: React 19, Vite, JavaScript
- Mobile: React Native, Expo (SDK 57), Expo Router, TypeScript
- CI: GitHub Actions
- CD: Vercel (web)

## Cấu trúc thư mục

```
CNPM/
├── web/       # Ứng dụng web (React + Vite)
├── mobile/    # Ứng dụng mobile (React Native + Expo)
└── .github/   # Cấu hình CI (GitHub Actions)
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

- Không code trực tiếp lên nhánh `main`, mỗi tính năng làm trên một nhánh riêng (ví dụ `feature/web-upload`).
- Làm xong thì mở Pull Request, CI tự chạy kiểm tra, đạt thì gộp vào `main`.
- Gộp vào `main` thì Vercel tự cập nhật bản web.

## Tài liệu

- [PRD](PRD_Thuyet_Minh_Da_Ngon_Ngu_FrontEnd.docx)
