import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Web User chạy cổng 5173. host: true để điện thoại cùng mạng Wi-Fi mở được qua IP của laptop
// (ví dụ http://192.168.1.10:5173) – dùng cho phần demo quét mã QR.
// Vite chuyển tiếp /api và /socket.io sang API nên trình duyệt coi như cùng nguồn (cookie rt_web hoạt động).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const target = env.API_PROXY_TARGET || 'http://localhost:3000'
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        // xfwd: gửi kèm X-Forwarded-For để API biết IP thật của từng điện thoại
        '/api': { target, changeOrigin: true, xfwd: true },
        '/socket.io': { target, ws: true, changeOrigin: true, xfwd: true },
      },
    },
  }
})
