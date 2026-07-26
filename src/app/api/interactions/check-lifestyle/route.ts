import { screenDeterministically } from "@/lib/interactions/deterministic";
import { loadPrivacySafeGraph } from "@/lib/interactions/graph";
import { investigatorModel } from "@/lib/interactions/investigator";
import {
  createInteractionRun,
  loadInteractionKnowledge,
  persistDeterministicFindings,
} from "@/lib/interactions/repository";
import { investigationRequestSchema } from "@/lib/interactions/schemas";
import { createInvestigationStream } from "@/lib/interactions/streaming";
import { jsonError, requireJson, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to check your Lifestyle Network.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  if (!requireJson(request)) return jsonError("Send JSON.", 415);
  const parsed = investigationRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success || parsed.data.consentConfirmed !== true) {
    return jsonError(
      "Confirm that SignalRx may process a privacy-minimized graph for this investigation.",
      400,
    );
  }
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Evidence investigation is not configured.", 503);

  try {
    const [{ graph, hash }, knowledge] = await Promise.all([
      loadPrivacySafeGraph(admin, auth.userId),
      loadInteractionKnowledge(admin),
    ]);
    const deterministicFindings = screenDeterministically(
      graph,
      knowledge.ddi,
      knowledge.rules,
    );
    const run = await createInteractionRun(admin, {
      userId: auth.userId,
      kind: "lifestyle_investigation",
      graph,
      graphHash: hash,
      model: investigatorModel,
    });
    await persistDeterministicFindings(
      admin,
      auth.userId,
      run.id,
      deterministicFindings,
    );
    return createInvestigationStream({
      request,
      admin,
      userId: auth.userId,
      runId: run.id,
      graph,
      mode: "lifestyle",
      deterministicFindings,
      jurisdiction: parsed.data.jurisdiction,
    });
  } catch (error) {
    return jsonError(
      "The Lifestyle Network could not be prepared for investigation.",
      503,
      error instanceof Error ? error.message : undefined,
    );
  }
}

