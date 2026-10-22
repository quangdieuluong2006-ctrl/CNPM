import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken, refreshSession } from "../lib/api";

const PING_INTERVAL_MS = 30_000; // nhịp tim presence (PRD v3.0, mục 3.7 và Phụ lục C)

// Mở kết nối Socket.IO khi đã đăng nhập: server ghi một phiên vào user_sessions,
// nhờ đó Web Admin biết người dùng này đang hoạt động.
export function usePresence(enabled, onRevoked) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = io(import.meta.env.VITE_API_BASE_URL || undefined, {
      auth: (cb) => cb({ token: getAccessToken() }), // mỗi lần kết nối lại lấy token mới nhất
      query: { clientType: "web" },
      transports: ["websocket"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => {
      const code = err.data?.code ?? err.message;
      if (code === "AUTH_TOKEN_EXPIRED") {
        refreshSession().then(
          () => socket.connect(),
          () => onRevoked?.(),
        );
      } else if (code === "ACCOUNT_LOCKED" || code === "AUTH_TOKEN_INVALID") {
        onRevoked?.(code);
      }
    });
    // Admin khóa tài khoản → server báo session.revoked → đăng xuất ngay
    socket.on("session.revoked", (p) => onRevoked?.(p?.reason));

    const ping = setInterval(() => {
      if (socket.connected) socket.emit("presence.ping", {});
    }, PING_INTERVAL_MS);

    return () => {
      clearInterval(ping);
      socket.disconnect();
      setConnected(false);
    };
  }, [enabled, onRevoked]);

  return connected;
}
