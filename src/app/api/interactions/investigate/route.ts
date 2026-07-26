import type { DeterministicFinding } from "@/lib/interactions/deterministic";
import { loadPrivacySafeGraph } from "@/lib/interactions/graph";
import { investigatorModel } from "@/lib/interactions/investigator";
import {
  createInteractionRun,
  getOwnedFinding,
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
  if (!auth) return jsonError("Sign in to investigate a concern.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  if (!requireJson(request)) return jsonError("Send JSON.", 415);
  const parsed = investigationRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return jsonError("Check the investigation details.", 400);
  if (!parsed.data.findingId) {
    return jsonError("A documented finding is required for pair investigation.", 400);
  }
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Evidence investigation is not configured.", 503);

  const finding = await getOwnedFinding(admin, auth.userId, parsed.data.findingId);
  if (!finding) return jsonError("The interaction finding was not found.", 404);
  if (finding.finding_type !== "documented_concern") {
    return jsonError("Only documented concerns can start pair investigation.", 409);
  }
  const factorNames = (finding.canonical_names?.length
    ? finding.canonical_names
    : finding.factor_names) as string[];
  if (factorNames.length < 2) {
    return jsonError("This finding does not contain a factor pair.", 409);
  }

  const { graph, hash } = await loadPrivacySafeGraph(admin, auth.userId);
  const run = await createInteractionRun(admin, {
    userId: auth.userId,
    kind: "pair_investigation",
    graph,
    graphHash: hash,
    model: investigatorModel,
  });
  const deterministicFinding: DeterministicFinding = {
    findingType: "documented_concern",
    triggerType: finding.trigger_type,
    factorRefs: finding.factor_refs,
    factorNames: finding.factor_names,
    canonicalNames: finding.canonical_names,
    sourceSeverity: finding.source_severity,
    deterministicSource: finding.deterministic_source ?? {},
  };

  return createInvestigationStream({
    request,
    admin,
    userId: auth.userId,
    runId: run.id,
    graph,
    mode: "pair",
    deterministicFindings: [deterministicFinding],
    baseFindingIds: [finding.id],
    pair: { factorA: factorNames[0], factorB: factorNames[1] },
    jurisdiction: parsed.data.jurisdiction,
  });
}

