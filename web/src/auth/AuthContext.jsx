import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "../lib/api";
import { AuthContext } from "./context";

// status: "loading" → đang khôi phục phiên; "authenticated"; "guest"
export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  // Lời chào sau khi đăng nhập/đăng ký (không hiện khi chỉ khôi phục phiên lúc tải lại trang)
  const [welcome, setWelcome] = useState(null);

  const toGuest = useCallback(() => {
    api.clearSession();
    setUser(null);
    setStatus("guest");
  }, []);

  const accept = useCallback((session) => {
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  // Mở trang: khôi phục phiên từ cookie rt_web (giữ đăng nhập khi tải lại trang)
  useEffect(() => {
    api.setSessionExpiredHandler(toGuest);
    api.refreshSession().then(accept, () => setStatus("guest"));
    return () => api.setSessionExpiredHandler(null);
  }, [accept, toGuest]);

  const login = useCallback(
    async (email, password) => {
      accept(await api.login(email, password));
      setWelcome("login");
    },
    [accept],
  );
  const register = useCallback(
    async (input) => {
      accept(await api.register(input));
      setWelcome("register");
    },
    [accept],
  );
  const dismissWelcome = useCallback(() => setWelcome(null), []);
  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    toGuest();
  }, [toGuest]);

  const value = useMemo(
    () => ({ status, user, welcome, login, register, logout, dismissWelcome }),
    [status, user, welcome, login, register, logout, dismissWelcome],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
