import { after } from "next/server";
import { bearer, database, hash, publicRun } from "@/lib/checker/store";
import { reply } from "@/lib/checker/http";
import { drainQueue, cleanSession, type Job } from "@/lib/checker/worker";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(request: Request) {
  try {
    const token = bearer(request);
    const run = token ? await publicRun(token) : null;
    if (!run) return reply({ error: "Check not found or expired." }, 404);
    after(async () => { try { await drainQueue(); } catch { /* Scheduled maintenance retries. */ } });
    return reply({ run });
  } catch { return reply({ error: "Status temporarily unavailable." }, 503); }
}
export async function DELETE(request: Request) {
  try {
    const token = bearer(request);
    if (!token || !await publicRun(token)) return reply({ error: "Check not found or expired." }, 404);
    const db = database(), runHash = hash(token);
    const cancelled = await db.from("checker_runs").update({ cancelled: true }).eq("token_hash", runHash);
    if (cancelled.error) throw cancelled.error;
    const jobs = await db.from("checker_jobs").update({ status: "cancelled", message: "Investigation cancelled." }).eq("run_hash", runHash).in("status", ["queued", "running"]).select("*");
    if (jobs.error) throw jobs.error;
    after(async () => { for (const job of jobs.data ?? []) { try { await cleanSession(job as Job); } catch { /* Retain provider ID for scheduled retry. */ } } });
    return reply({ run: await publicRun(token) });
  } catch { return reply({ error: "Cancellation could not be confirmed. Please retry." }, 503); }
}
