import { useEffect, useRef, useState } from "react";
import { IconLogout } from "./icons";

function initials(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  return (last[0] ?? "?").toUpperCase();
}

// Ảnh đại diện (chữ cái đầu tên) + chấm trạng thái; bấm vào mở menu tài khoản.
export default function UserMenu({ user, online, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tài khoản ${user.fullName}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar">{initials(user.fullName)}</span>
        <span className={`presence-dot ${online ? "on" : ""}`} title={online ? "Đang trực tuyến" : "Đang kết nối…"} />
      </button>

      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <div className="menu-name">{user.fullName}</div>
            <div className="menu-email">{user.email}</div>
            <div className={`menu-status ${online ? "on" : ""}`}>
              <span className={`presence-dot inline ${online ? "on" : ""}`} />
              {online ? "Đang trực tuyến" : "Đang kết nối…"}
            </div>
          </div>
          <button type="button" role="menuitem" className="menu-item" onClick={onLogout}>
            <IconLogout size={18} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
