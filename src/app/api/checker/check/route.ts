import { after } from "next/server";
import { body, reply, RequestError } from "@/lib/checker/http";
import { checkSchema, buildPairs } from "@/lib/checker/types";
import { database, clientKey, runToken, hash, existingRun, createRun, publicRun, limit } from "@/lib/checker/store";
import { resolveMedicine } from "@/lib/checker/identity";
import { checkSources, ddinterAdapter } from "@/lib/checker/sources";
import { drainQueue } from "@/lib/checker/worker";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  try {
    const input = checkSchema.safeParse(await body(request));
    if (!input.success) return reply({ error: "Confirm between two and ten medicines." }, 400);
    const client = clientKey(request), token = runToken(client, input.data.idempotencyKey), requestHash = hash(JSON.stringify(input.data.medicines));
    const existing = await existingRun(token);
    if (existing) {
      if (existing.request_hash !== requestHash) return reply({ error: "This submission key belongs to a different prescription." }, 409);
      return reply({ token, run: await publicRun(token) });
    }
    if (!await limit(`check:${client}`)) return reply({ error: "Five checks per ten minutes are allowed. Please try later." }, 429);
    const resolved = await Promise.all(input.data.medicines.map(m => resolveMedicine(database(), m)));
    if (resolved.some(m => !m)) return reply({ error: "Clarify the highlighted medicine identities before checking.", unresolved: resolved.flatMap((m, i) => m ? [] : [i]) }, 422);
    const medicines = resolved.filter(m => m !== null);
    const sources = await checkSources([ddinterAdapter(database())], medicines.flatMap(m => m.ingredients));
    await createRun(token, requestHash, { pairs: buildPairs(medicines, sources), coverage: sources.coverage });
    const saved = await existingRun(token);
    if (saved?.request_hash !== requestHash) return reply({ error: "Submission key conflict." }, 409);
    after(async () => { try { await drainQueue(); } catch { /* Durable jobs are retried by maintenance. */ } });
    return reply({ token, run: await publicRun(token) });
  } catch (error) { return error instanceof RequestError ? reply({ error: error.message }, error.status) : reply({ error: "The checker is temporarily unavailable. Please try again later." }, 503); }
}
