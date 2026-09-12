import { createHash, createHmac } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CheckResult, PublicRun } from "./types";

export function database() {
  const db = getSupabaseAdminClient();
  if (!db) throw new Error("Checker storage is not configured.");
  return db;
}
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function clientKey(request: Request) {
  // Only trust Vercel's overwritten header. Other deployments share a bucket unless configured behind a trusted proxy.
  const address = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") : "local";
  const secret = process.env.CHECKER_TOKEN_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Checker token secret is not configured.");
  return createHmac("sha256", secret).update(address || "unknown").digest("hex");
}
export function runToken(client: string, idempotencyKey: string) {
  const secret = process.env.CHECKER_TOKEN_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Checker token secret is not configured.");
  return createHmac("sha256", secret).update(`${client}:${idempotencyKey}`).digest("hex");
}
export async function limit(key: string, count = 5, seconds = 600) {
  const { data, error } = await database().rpc("checker_take_limit", { p_key: key, p_limit: count, p_seconds: seconds });
  if (error) throw new Error("Checker quota storage is unavailable.");
  return data === true;
}
export async function existingRun(token: string) {
  const { data, error } = await database().from("checker_runs").select("*").eq("token_hash", hash(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("Checker storage is unavailable.");
  return data;
}
export async function createRun(token: string, requestHash: string, result: CheckResult) {
  const { error } = await database().rpc("checker_create_run", { p_hash: hash(token), p_request: requestHash, p_result: result });
  if (error) throw new Error("Could not save the temporary check.");
}
export async function publicRun(token: string): Promise<PublicRun | null> {
  const row = await existingRun(token);
  if (!row) return null;
  const { data: jobs, error } = await database().from("checker_jobs").select("pair_id,status,report,message").eq("run_hash", hash(token));
  if (error) throw new Error("Could not retrieve investigation status.");
  const result = row.result as CheckResult;
  const pairs = result.pairs.map(p => {
    const job = jobs?.find(j => j.pair_id === p.id);
    return job ? { ...p, research: job.status, report: job.report ?? undefined, message: job.message ?? undefined } : p;
  });
  return { ...result, pairs, expiresAt: row.expires_at, status: row.cancelled ? "cancelled" : pairs.some(p => ["queued", "running"].includes(p.research)) ? "running" : "completed" };
}
export function bearer(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
