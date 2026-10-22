import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "../lib/api";
import { AuthContext } from "./context";

// status: "loading" → đang khôi phục phiên; "authenticated"; "guest"
export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);

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

  const login = useCallback(async (email, password) => accept(await api.login(email, password)), [accept]);
  const register = useCallback(async (input) => accept(await api.register(input)), [accept]);
  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    toGuest();
  }, [toGuest]);

  const value = useMemo(() => ({ status, user, login, register, logout }), [status, user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
