import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, clearSession, getAccessToken, login } from "../src/lib/api";

const session = (token: string) => ({
  accessToken: token,
  expiresIn: 900,
  csrfToken: "csrf-1",
  user: { id: 1, email: "admin@demo.vn", fullName: "Quản trị viên", role: "admin", status: "active", locale: "vi", plan: { id: 3, name: "Pro" } },
});
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const expired = () => json(401, { error: { code: "AUTH_TOKEN_EXPIRED", message: "Phiên đăng nhập đã hết hạn" } });

describe("lớp gọi API của Web Admin", () => {
  beforeEach(() => clearSession());
  afterEach(() => vi.unstubAllGlobals());

  it("đăng nhập gửi clientType=admin và giữ access token trong bộ nhớ", async () => {
    const fetchMock = vi.fn(async () => json(200, session("tok-1")));
    vi.stubGlobal("fetch", fetchMock);
    await login("admin@demo.vn", "Demo@12345");
    expect(getAccessToken()).toBe("tok-1");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ clientType: "admin" });
    expect(init.credentials).toBe("include");
  });

  it("5 request cùng gặp 401 hết hạn → chỉ gọi /auth/refresh MỘT lần rồi gửi lại cả 5 (PRD AC5)", async () => {
    let refreshCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.endsWith("/auth/refresh")) {
          refreshCalls++;
          await new Promise((r) => setTimeout(r, 20));
          return json(200, session("tok-new"));
        }
        const auth = new Headers(init?.headers).get("Authorization");
        return auth === "Bearer tok-new" ? json(200, { ok: true }) : expired();
      }),
    );
    const results = await Promise.all(Array.from({ length: 5 }, () => apiGet<{ ok: boolean }>("/admin/stats")));
    expect(results).toEqual(Array(5).fill({ ok: true }));
    expect(refreshCalls).toBe(1);
  });

  it("refresh thất bại → báo lỗi và xóa phiên", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/auth/refresh") ? json(401, { error: { code: "AUTH_REFRESH_INVALID", message: "x" } }) : expired(),
      ),
    );
    await expect(apiGet("/admin/stats")).rejects.toMatchObject({ code: "AUTH_REFRESH_INVALID" });
    expect(getAccessToken()).toBeNull();
  });

  it("403 không tự làm mới token mà trả lỗi ngay", async () => {
    const fetchMock = vi.fn(async () => json(403, { error: { code: "FORBIDDEN", message: "Bạn không có quyền" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiGet("/admin/stats")).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
