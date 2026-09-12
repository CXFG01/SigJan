import { timingSafeEqual } from "node:crypto";
import { drainQueue, reconcileProviderSessions } from "@/lib/checker/worker";
import { reply } from "@/lib/checker/http";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`, received = request.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || received.length !== expected.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(received))) return reply({ error: "Unauthorized." }, 401);
  // Local expiry must run even when provider authentication or networking is unavailable.
  try { await drainQueue(); await reconcileProviderSessions(); return reply({ ok: true }); } catch { return reply({ error: "Maintenance failed." }, 503); }
}
