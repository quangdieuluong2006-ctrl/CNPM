import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { errorMessage } from "../lib/api";

// Trang Đăng nhập / Đăng ký (UC-01, UC-02). Mã QR trên Web Admin mở thẳng /register.
export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(() => (window.location.pathname.startsWith("/register") ? "register" : "login"));
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "", agree: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const switchMode = (next) => {
    setMode(next);
    setError("");
    window.history.replaceState(null, "", next === "register" ? "/register" : "/login");
  };

  const validate = () => {
    if (!isRegister) return "";
    if (!form.fullName.trim()) return "Vui lòng nhập họ tên";
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      return "Mật khẩu cần ít nhất 8 ký tự, có cả chữ và số";
    if (form.password !== form.confirm) return "Mật khẩu xác nhận không khớp";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) await register({ fullName: form.fullName.trim(), email: form.email, password: form.password });
      else await login(form.email, form.password);
      window.history.replaceState(null, "", "/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <div className="logo">🎬</div>
        <div>
          <div className="app-title">Thuyết minh đa ngôn ngữ</div>
          <div className="app-sub">Lồng tiếng video tự động</div>
        </div>
      </div>

      <form className="card auth-card" onSubmit={onSubmit} noValidate>
        <div className="tabs auth-tabs">
          <button type="button" className={`tab ${!isRegister ? "active" : ""}`} onClick={() => switchMode("login")}>
            Đăng nhập
          </button>
          <button type="button" className={`tab ${isRegister ? "active" : ""}`} onClick={() => switchMode("register")}>
            Đăng ký
          </button>
        </div>

        {isRegister && (
          <label className="field">
            <span>Họ tên</span>
            <input className="input" autoComplete="name" value={form.fullName} onChange={set("fullName")} required />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} required />
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            className="input"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={form.password}
            onChange={set("password")}
            required
          />
          {isRegister && <small className="field-hint">Ít nhất 8 ký tự, có cả chữ và số</small>}
        </label>
        {isRegister && (
          <>
            <label className="field">
              <span>Xác nhận mật khẩu</span>
              <input className="input" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} required />
            </label>
            <label className="field-check">
              <input type="checkbox" checked={form.agree} onChange={set("agree")} />
              <span>Tôi đồng ý với Điều khoản sử dụng</span>
            </label>
          </>
        )}

        {error && (
          <p className="error-msg" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-lg auth-submit" type="submit" disabled={submitting || (isRegister && !form.agree)}>
          {submitting ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
