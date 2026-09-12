import { setTimeout as delay } from "node:timers/promises";
import OpenAI from "openai";
import { agentsClient, deleteSession, reportFromItems, startSession } from "./agents";
import { database } from "./store";
import type { CheckResult, Pair } from "./types";
import { readAuthoritativeSource } from "./evidence";

export type Job = { id: string; run_hash: string; pair_id: string; session_id: string | null; status: string; started_at: string };
async function finish(job: Job, status: string, message?: string, report?: unknown) {
  const db = database();
  const { error } = await db.from("checker_jobs").update({ status, message, report }).eq("id", job.id).eq("status", "running");
  if (error) throw new Error("Could not save investigation outcome.");
}
export async function cleanSession(job: Job) {
  if (!job.session_id) return;
  await deleteSession(job.session_id);
  const { error } = await database().from("checker_jobs").update({ session_id: null }).eq("id", job.id).eq("session_id", job.session_id);
  if (error) throw new Error("Cleanup tracking unavailable.");
}
export async function perform(job: Job) {
  const db = database();
  try {
    const { data: run, error } = await db.from("checker_runs").select("result,cancelled,expires_at").eq("token_hash", job.run_hash).single();
    if (error) throw new Error("Run unavailable.");
    if (run.cancelled || Date.parse(run.expires_at) <= Date.now()) { await finish(job, "cancelled"); return; }
    const pair = (run.result as CheckResult).pairs.find(p => p.id === job.pair_id) as Pair;
    if (!process.env.OPENAI_API_KEY) { await finish(job, "unavailable", "Agents API is not configured."); return; }
    const session = await startSession(pair, job.id);
    job.session_id = session.id;
    const saved = await db.from("checker_jobs").update({ session_id: session.id }).eq("id", job.id);
    if (saved.error) throw new Error("Session tracking unavailable.");
    const client = agentsClient();
    const deadline = Date.parse(job.started_at) + 90_000;
    const options = { signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())) };
    while (Date.now() < deadline) {
      const state = await db.from("checker_jobs").select("status").eq("id", job.id).single();
      if (state.error) throw new Error("Run state unavailable.");
      if (state.data.status !== "running") return;
      const current = await client.beta.agents.sessions.retrieve(session.id, options);
      // Usage is best effort. Deadline and daily reservations remain the hard application controls.
      if ((current.usage?.total_tokens ?? 0) > 25_000) { await finish(job, "skipped", "Investigation usage threshold reached."); return; }
      if (current.status === "failed") throw new Error("Provider investigation failed.");
      for (const action of current.required_actions) {
        if (action.type !== "function_call") throw new Error("Unexpected provider action.");
        let outcome: { success: true; output: string } | { success: false; error: string };
        try {
          const args = action.arguments as Record<string, unknown>;
          if (action.name === "lookup_pair_evidence" && Object.keys(args ?? {}).length === 0) outcome = { success: true, output: JSON.stringify({ findings: pair.findings, duplicateIngredients: pair.duplicateIngredients, coverage: run.result.coverage }) };
          else if (action.name === "read_authoritative_source" && Object.keys(args ?? {}).length === 1) outcome = { success: true, output: JSON.stringify(await readAuthoritativeSource(args.url)) };
          else throw new Error("Unsupported tool.");
        } catch { outcome = { success: false, error: "This source or lookup could not be read. Use another allowed source; do not cite this failure." }; }
        await client.beta.agents.sessions.events.create(session.id, { events: [{
          type: "agent.session.input.tool_result", turn_id: action.turn_id, call_id: action.call_id,
          ...outcome,
        }] }, options);
      }
      const turns = await client.beta.agents.sessions.turns.list(session.id, { limit: 1, order: "desc" }, options);
      const turn = turns.data[0];
      if (turn?.status === "completed") {
        const items = [];
        for await (const item of client.beta.agents.sessions.items.list(session.id, { order: "asc" }, options)) {
          items.push(item);
          if (items.length > 200) throw new Error("Investigation exceeded its item budget.");
        }
        try {
          const report = reportFromItems(items, pair);
          await finish(job, report.reports[0].evidenceState === "insufficient" ? "insufficient" : "completed", undefined, report);
        } catch { await finish(job, "insufficient", "The returned evidence did not pass publication checks. This pair remains unresolved."); }
        return;
      }
      if (turn && ["failed", "cancelled"].includes(turn.status)) throw new Error("Provider investigation did not complete.");
      await delay(1_500);
    }
    await finish(job, "timed_out", "The 90-second investigation window ended. Evidence remains unresolved.");
  } catch (error) {
    const unavailable = error instanceof OpenAI.APIError && [400, 401, 403, 404, 429].includes(error.status ?? 0);
    const timedOut = Date.now() >= Date.parse(job.started_at) + 90_000;
    await finish(job, timedOut ? "timed_out" : unavailable ? "unavailable" : "failed", timedOut ? "The investigation deadline ended. Evidence remains unresolved." : unavailable ? "Agents API is unavailable for this configuration or account. Database findings remain available." : "Investigation failed. Database findings remain available.");
  } finally {
    try { await cleanSession(job); } catch { /* Keep provider ID for maintenance retry; never log medicine content. */ }
  }
}

export async function maintenance() {
  const db = database(), now = new Date().toISOString();
  // Scrub content at expiry even if provider deletion needs a retry.
  const scrub = await db.from("checker_runs").update({ result: { pairs: [], coverage: [] }, cancelled: true }).lte("expires_at", now);
  if (scrub.error) throw new Error("Temporary data cleanup failed.");
  const expired = await db.from("checker_runs").select("token_hash").lte("expires_at", now);
  for (const run of expired.data ?? []) {
    await db.from("checker_jobs").update({ status: "cancelled", report: null, message: null }).eq("run_hash", run.token_hash);
  }
  await db.from("checker_jobs").update({ status: "timed_out", message: "Investigation worker expired; evidence remains unresolved." }).eq("status", "running").lt("lease_until", now);
  const cleanup = await db.from("checker_jobs").select("*").not("session_id", "is", null).not("status", "in", "(queued,running)");
  for (const job of cleanup.data ?? []) { try { await cleanSession(job as Job); } catch { /* Retry on next maintenance pass. */ } }
  for (const run of expired.data ?? []) {
    const pending = await db.from("checker_jobs").select("id").eq("run_hash", run.token_hash).not("session_id", "is", null);
    if (!pending.error && !pending.data?.length) await db.from("checker_runs").delete().eq("token_hash", run.token_hash);
  }
  await db.from("checker_counters").delete().lt("expires_at", now);
}
export async function reconcileProviderSessions() {
  // Recover ambiguous creates (e.g. a worker dies after provider creation but before saving its ID).
  if (!process.env.OPENAI_API_KEY) return;
  const db = database(), client = agentsClient();
  for await (const session of client.beta.agents.sessions.list({ order: "desc", limit: 100 })) {
    if (session.metadata.application !== "signalrx-checker" || !session.metadata.job_id) continue;
    const lookup = await db.from("checker_jobs").select("id,status,session_id").eq("id", session.metadata.job_id).maybeSingle();
    if (lookup.error) throw new Error("Session reconciliation unavailable.");
    if (!lookup.data || !["running", "queued"].includes(lookup.data.status)) {
      try { await deleteSession(session.id); } catch { /* Next maintenance pass retries. */ }
    } else if (!lookup.data.session_id) {
      await db.from("checker_jobs").update({ session_id: session.id }).eq("id", lookup.data.id).is("session_id", null);
    }
  }
}
export async function drainQueue() {
  await maintenance();
  const daily = Math.max(0, Math.min(30, Number(process.env.CHECKER_DAILY_SESSIONS ?? 30) || 0));
  // Two workers, at most three jobs each: bounded under the route's 300s duration.
  await Promise.all([0, 1].map(async () => {
    for (let i = 0; i < 3; i++) {
      const { data, error } = await database().rpc("checker_claim_job", { p_daily_limit: daily });
      if (error) throw new Error("Investigation queue is unavailable.");
      const job = data?.[0] as Job | undefined;
      if (!job) return;
      await perform(job);
    }
  }));
}
