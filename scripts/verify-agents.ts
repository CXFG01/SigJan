import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { parseEnv } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { agentsClient, startSession, deleteSession, reportFromItems } from "../src/lib/checker/agents";
import { buildPairs } from "../src/lib/checker/types";
import { readAuthoritativeSource } from "../src/lib/checker/evidence";

// Explicit opt-in verification: synthetic data only; loads the local key without printing it.
Object.assign(process.env, parseEnv(readFileSync(".env.local", "utf8")));
async function main() {
  if (process.argv.includes("--cleanup")) {
    const saved = JSON.parse(readFileSync(".qa/live-session.json", "utf8"));
    if (saved.id) { await deleteSession(saved.id); writeFileSync(".qa/live-session.json", JSON.stringify({ deleted: true })); }
    console.log("Provider cleanup confirmed."); return;
  }
  const pair = buildPairs(["Apixaban","Ibuprofen"].map(name => ({ name, dose: "", route: "", frequency: "", ingredients: [name.toLowerCase()], identitySource: "synthetic verification" })), { findings: [], coverage: [] })[0];
  const client = agentsClient(), started = Date.now();
  let sessionId: string | undefined;
  mkdirSync(".qa", { recursive: true });
  try {
    const session = await startSession(pair, crypto.randomUUID()); sessionId = session.id;
    writeFileSync(".qa/live-session.json", JSON.stringify({ id: sessionId }));
    console.log("Synthetic Agents API investigation started.");
    while (Date.now() - started < 90_000) {
      const current = await client.beta.agents.sessions.retrieve(sessionId);
      for (const action of current.required_actions) if (action.type === "function_call") {
        let outcome: { success: true; output: string } | { success: false; error: string };
        try { outcome = { success: true, output: JSON.stringify(action.name === "read_authoritative_source" ? await readAuthoritativeSource((action.arguments as { url: string }).url) : { findings: [], coverage: "Synthetic verification of an unresolved pair." }) }; }
        catch { outcome = { success: false, error: "Source unavailable. Use another authoritative source." }; }
        await client.beta.agents.sessions.events.create(sessionId, { events: [{ type: "agent.session.input.tool_result", turn_id: action.turn_id, call_id: action.call_id, ...outcome }] });
      }
      const turn = (await client.beta.agents.sessions.turns.list(sessionId, { limit: 1 })).data[0];
      if (turn?.status === "completed") {
        const items = [];
        for await (const item of client.beta.agents.sessions.items.list(sessionId, { order: "asc" })) items.push(item);
        writeFileSync(".qa/agents-synthetic-items.json", JSON.stringify(items, null, 2));
        const report = reportFromItems(items, pair);
        writeFileSync(".qa/agents-verification.json", JSON.stringify({ checkedAt: new Date().toISOString(), elapsedMs: Date.now()-started, model: session.agent.model, validation: "passed", report }, null, 2));
        console.log(JSON.stringify({ validation: "passed", elapsedMs: Date.now()-started, sourceCount: report.reports[0].sources.length }));
        return;
      }
      if (turn && ["failed", "cancelled"].includes(turn.status)) throw new Error(`Provider turn ${turn.status}: ${turn.error?.code ?? "unknown"}`);
      await delay(1500);
    }
    throw new Error("90-second verification deadline exceeded.");
  } catch (error) {
    console.log(error instanceof Error ? error.message.slice(0,800) : "Verification failed."); process.exitCode = 1;
  } finally {
    if (sessionId) { await deleteSession(sessionId); writeFileSync(".qa/live-session.json", JSON.stringify({ deleted: true })); console.log("Provider session deleted."); }
  }
}
void main();
