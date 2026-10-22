# Web User – React + Vite

Giao diện cho người dùng: đăng ký/đăng nhập, tải video lên, chọn ngôn ngữ, theo dõi tiến trình, xem kết quả.

| Phần | Trạng thái |
|---|---|
| Đăng ký, đăng nhập, đăng xuất, giữ phiên khi tải lại trang | Nối API thật (`/auth/*`) |
| Trạng thái "Đang trực tuyến" (Socket.IO + nhịp tim 30 giây) | Nối API thật – Web Admin thấy người dùng đang hoạt động |
| Tải lên, chọn ngôn ngữ, tiến trình, kết quả, lịch sử | Còn dùng dữ liệu giả (`src/data/mockData.js`), sẽ nối API upload/Job |

## Chạy

Cần API đang chạy ở `http://localhost:3000` (xem `api/README.md`).

```bash
cd web
npm install
npm run dev        # http://localhost:5173 và http://<IP-Wi-Fi>:5173 cho điện thoại
```

Vite chuyển tiếp `/api` và `/socket.io` sang API (`vite.config.js`), nên điện thoại chỉ cần mở được cổng 5173 của laptop.

## Cấu trúc phần mới

```
src/
├─ lib/api.js              # gọi API: token trong bộ nhớ, cookie rt_web + CSRF, tự làm mới token (single-flight)
├─ auth/AuthContext.jsx    # AuthProvider: khôi phục phiên, đăng nhập, đăng ký, đăng xuất
├─ auth/useAuth.js
├─ realtime/usePresence.js # Socket.IO clientType=web, nhịp tim 30 giây, bị khóa tài khoản thì đăng xuất
└─ pages/AuthPage.jsx      # Đăng nhập / Đăng ký (/register mở thẳng tab Đăng ký – dùng cho mã QR)
```
