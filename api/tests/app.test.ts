import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { splitBatches } from "../src/db/migrate.js";

const app = createApp();

describe("GET /health", () => {
  it("trả 200 và kèm X-Request-Id", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});

describe("định dạng lỗi chuẩn", () => {
  it("route không tồn tại trả 404 NOT_FOUND kèm requestId", async () => {
    const res = await request(app).get("/khong-ton-tai").set("X-Request-Id", "test-request-0001");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: "NOT_FOUND", requestId: "test-request-0001" });
  });

  it("JSON sai cú pháp trả 400 VALIDATION_ERROR", async () => {
    const res = await request(app).post("/health").set("Content-Type", "application/json").send("{sai");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("splitBatches", () => {
  it("tách theo dòng GO, bỏ khối rỗng, không tách chữ GO trong câu lệnh", () => {
    const sql = "CREATE TABLE a (id INT);\nGO\n\nSELECT 'GOOD' AS go_col;\ngo\nGO\n";
    expect(splitBatches(sql)).toEqual(["CREATE TABLE a (id INT);", "SELECT 'GOOD' AS go_col;"]);
  });
});
