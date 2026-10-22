import { migrate } from "../../src/db/migrate.js";
import { dbConfig, sql } from "../../src/db/pool.js";
import { seed } from "../../src/db/seed.js";

// Xóa và tạo lại ThuyetMinhDB_test, chạy migration + seed. Mỗi file test tích hợp gọi một lần.
export async function resetTestDb(): Promise<void> {
  const master = await new sql.ConnectionPool(dbConfig("master")).connect();
  await master.request().batch(`
    IF DB_ID('ThuyetMinhDB_test') IS NOT NULL
    BEGIN
      ALTER DATABASE ThuyetMinhDB_test SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE ThuyetMinhDB_test;
    END`);
  await master.close();
  await migrate(() => {});
  await seed(() => {});
}

export const runDbTests = process.env.RUN_DB_TESTS === "1";
