// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role;");
  await db.exec(readFileSync("supabase/migrations/20260912162223_anonymous_checker.sql", "utf8"));
}, 30000);
afterAll(async () => { await db.close(); });
describe("private durable queue", () => {
  it("atomically caps counters, including a disabled quota", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => db.query<{ allowed: boolean }>("select checker_take_limit('client',5,600) as allowed")));
    expect(results.filter(r => r.rows[0].allowed)).toHaveLength(5);
    expect((await db.query<{ allowed: boolean }>("select checker_take_limit('disabled',0,600) as allowed")).rows[0].allowed).toBe(false);
  });
  it("deduplicates submissions and keeps at most two sessions active", async () => {
    const result = JSON.stringify({ pairs: [0,1,2].map(i => ({ id: String(i), reason: "uncovered", research: "queued" })), coverage: [] });
    await db.query("select checker_create_run('token','request',$1::jsonb)", [result]);
    await db.query("select checker_create_run('token','request',$1::jsonb)", [result]);
    expect((await db.query("select * from checker_jobs")).rows).toHaveLength(3);
    expect((await db.query("select * from checker_claim_job(30)")).rows).toHaveLength(1);
    expect((await db.query("select * from checker_claim_job(30)")).rows).toHaveLength(1);
    expect((await db.query("select * from checker_claim_job(30)")).rows).toHaveLength(0);
    await db.exec("update checker_jobs set status='completed',session_id='pending-cleanup' where status='running'");
    expect((await db.query("select * from checker_claim_job(30)")).rows).toHaveLength(0);
  });
  it("does not claim cancelled or expired work", async () => {
    await db.exec("update checker_jobs set session_id=null; update checker_runs set cancelled=true;");
    expect((await db.query("select * from checker_claim_job(30)")).rows).toHaveLength(0);
    await db.exec("update checker_runs set cancelled=false,expires_at=now()-interval '1 second'");
    expect((await db.query("select * from checker_claim_job(30)")).rows).toHaveLength(0);
  });
  it("denies public access to runs and privileged functions", async () => {
    await db.exec("set role anon");
    await expect(db.query("select * from checker_runs")).rejects.toThrow();
    await expect(db.query("select checker_claim_job(30)")).rejects.toThrow();
    await db.exec("reset role");
  });
});
