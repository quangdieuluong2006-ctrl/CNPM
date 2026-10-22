// Lớp gọi API của Web User (PRD v3.0, mục 7.3).
// - access token chỉ giữ trong bộ nhớ; refresh token nằm trong cookie HttpOnly rt_web
// - gặp 401 hết hạn → làm mới MỘT lần (single-flight) rồi gửi lại request
// - lỗi chuẩn hóa về ApiError { status, code, message }

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api/v1";
const CLIENT_TYPE = "web";

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken = null;
let csrfToken = null;
let refreshing = null;
let onSessionExpired = null;

export function getAccessToken() {
  return accessToken;
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

function rememberSession(session) {
  accessToken = session.accessToken;
  csrfToken = session.csrfToken;
  return session;
}

export function clearSession() {
  accessToken = null;
  csrfToken = null;
}

// Tải lại trang thì csrfToken trong bộ nhớ mất → đọc lại từ cookie csrf_web (không HttpOnly).
function readCsrf() {
  if (csrfToken) return csrfToken;
  const m = document.cookie.match(/(?:^|;\s*)csrf_web=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

async function toApiError(res) {
  try {
    const body = await res.json();
    if (body?.error?.code) return new ApiError(res.status, body.error.code, body.error.message, body.error.details);
  } catch {
    // body không phải JSON
  }
  return new ApiError(res.status, "HTTP_" + res.status, `Lỗi máy chủ (${res.status})`);
}

async function rawFetch(path, init = {}) {
  try {
    return await fetch(API_BASE + path, { credentials: "include", ...init });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Không kết nối được máy chủ");
  }
}

async function postSession(path, payload) {
  const res = await rawFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, clientType: CLIENT_TYPE }),
  });
  if (!res.ok) throw await toApiError(res);
  return rememberSession(await res.json());
}

export function register({ email, password, fullName }) {
  return postSession("/auth/register", { email, password, fullName, locale: "vi" });
}

export function login(email, password) {
  return postSession("/auth/login", { email, password });
}

// Single-flight: nhiều request cùng hết hạn token thì chỉ gọi /auth/refresh một lần.
export function refreshSession() {
  refreshing ??= (async () => {
    try {
      const res = await rawFetch("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": readCsrf() },
        body: JSON.stringify({ clientType: CLIENT_TYPE }),
      });
      if (!res.ok) {
        clearSession();
        throw await toApiError(res);
      }
      return rememberSession(await res.json());
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function logout() {
  try {
    await rawFetch("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": readCsrf() },
      body: JSON.stringify({ clientType: CLIENT_TYPE }),
    });
  } finally {
    clearSession();
  }
}

export async function apiGet(path) {
  const send = () => rawFetch(path, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} });
  let res = await send();
  if (res.status === 401) {
    const err = await toApiError(res);
    if (err.code !== "AUTH_TOKEN_EXPIRED" && err.code !== "AUTH_REQUIRED") throw err;
    try {
      await refreshSession();
    } catch (refreshErr) {
      onSessionExpired?.();
      throw refreshErr;
    }
    res = await send();
  }
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

// Thông điệp tiếng Việt theo mã lỗi chuẩn (PRD v3.0, mục 8.5)
export function errorMessage(err) {
  if (!(err instanceof ApiError)) return "Đã có lỗi xảy ra, vui lòng thử lại";
  switch (err.code) {
    case "AUTH_INVALID_CREDENTIALS":
      return "Email hoặc mật khẩu không đúng";
    case "EMAIL_TAKEN":
      return "Email này đã được đăng ký – hãy đăng nhập";
    case "ACCOUNT_LOCKED":
      return "Tài khoản đã bị khóa, vui lòng liên hệ hỗ trợ";
    case "RATE_LIMITED":
      return "Bạn đã thử sai quá nhiều lần, vui lòng đợi rồi thử lại";
    case "VALIDATION_ERROR": {
      const first = err.details?.fields?.[0];
      return first?.message ?? "Dữ liệu không hợp lệ";
    }
    case "DB_UNAVAILABLE":
      return "Máy chủ chưa kết nối được cơ sở dữ liệu";
    case "NETWORK_ERROR":
      return "Không kết nối được máy chủ – kiểm tra mạng";
    default:
      return err.message;
  }
}
