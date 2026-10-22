import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { IconEye, IconEyeOff, IconGlobe, IconMic, IconSubtitle } from "../components/icons";
import Logo from "../components/Logo";
import { errorMessage } from "../lib/api";

const FEATURES = [
  { icon: IconGlobe, title: "10 ngôn ngữ", text: "Việt, Anh, Nhật, Hàn, Trung, Pháp, Đức…" },
  { icon: IconMic, title: "Giọng đọc tự nhiên", text: "Chọn giọng nam hoặc nữ, giữ nhạc nền gốc" },
  { icon: IconSubtitle, title: "Kèm phụ đề", text: "Xuất video lồng tiếng và tệp phụ đề" },
];

// Ô mật khẩu có nút hiện/ẩn
function PasswordInput({ value, onChange, autoComplete }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="input-wrap">
      <input
        className="input"
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required
      />
      <button type="button" className="input-addon" onClick={() => setShown((v) => !v)} aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
        {shown ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </button>
    </div>
  );
}

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
    <div className="auth-page">
      <section className="auth-hero">
        <div className="brand brand-light">
          <Logo size={40} />
          <div className="brand-text">
            <span className="brand-name">Thuyết minh</span>
            <span className="brand-sub">đa ngôn ngữ</span>
          </div>
        </div>
        <h1 className="hero-title">Lồng tiếng video sang ngôn ngữ khác chỉ với vài thao tác</h1>
        <p className="hero-desc">Tải video lên, chọn ngôn ngữ đích – hệ thống tự nhận dạng lời nói, dịch và đọc lại bằng giọng tự nhiên.</p>
        <ul className="hero-features">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="hero-feature-icon">
                <Icon size={20} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div>
            <h2 className="auth-title">{isRegister ? "Tạo tài khoản" : "Chào mừng trở lại"}</h2>
            <p className="auth-desc">{isRegister ? "Miễn phí 60 phút xử lý mỗi tháng." : "Đăng nhập để tiếp tục thuyết minh video."}</p>
          </div>

          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? "active" : ""} onClick={() => switchMode("login")}>
              Đăng nhập
            </button>
            <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? "active" : ""} onClick={() => switchMode("register")}>
              Đăng ký
            </button>
          </div>

          {isRegister && (
            <label className="field">
              <span>Họ tên</span>
              <input className="input" autoComplete="name" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set("fullName")} required />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="ban@vidu.com"
              value={form.email}
              onChange={set("email")}
              required
            />
          </label>
          <label className="field">
            <span>Mật khẩu</span>
            <PasswordInput value={form.password} onChange={set("password")} autoComplete={isRegister ? "new-password" : "current-password"} />
            {isRegister && <small className="field-hint">Ít nhất 8 ký tự, có cả chữ và số</small>}
          </label>
          {isRegister && (
            <>
              <label className="field">
                <span>Xác nhận mật khẩu</span>
                <PasswordInput value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
              </label>
              <label className="field-check">
                <input type="checkbox" checked={form.agree} onChange={set("agree")} />
                <span>Tôi đồng ý với Điều khoản sử dụng</span>
              </label>
            </>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-lg auth-submit" type="submit" disabled={submitting || (isRegister && !form.agree)}>
            {submitting ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
          </button>

          <p className="auth-switch">
            {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
            <button type="button" className="btn-link" onClick={() => switchMode(isRegister ? "login" : "register")}>
              {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
