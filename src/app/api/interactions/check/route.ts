import { NextResponse } from "next/server";
import { screenDeterministically } from "@/lib/interactions/deterministic";
import { loadPrivacySafeGraph } from "@/lib/interactions/graph";
import {
  completeInteractionRun,
  createInteractionRun,
  loadInteractionKnowledge,
  persistDeterministicFindings,
} from "@/lib/interactions/repository";
import { deterministicCheckRequestSchema } from "@/lib/interactions/schemas";
import { jsonError, requireJson, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to check your Lifestyle Network.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  if (!requireJson(request)) return jsonError("Send JSON.", 415);
  const parsed = deterministicCheckRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return jsonError("Check the assessment details.", 400);
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Interaction checking is not configured.", 503);

  const assessmentTime = parsed.data.assessmentTime
    ? new Date(parsed.data.assessmentTime)
    : new Date();
  try {
    const [{ graph, hash }, knowledge] = await Promise.all([
      loadPrivacySafeGraph(admin, auth.userId, assessmentTime),
      loadInteractionKnowledge(admin),
    ]);
    const run = await createInteractionRun(admin, {
      userId: auth.userId,
      kind: "deterministic_check",
      graph,
      graphHash: hash,
      assessmentTime: assessmentTime.toISOString(),
    });
    const findings = screenDeterministically(graph, knowledge.ddi, knowledge.rules);
    const persisted = await persistDeterministicFindings(
      admin,
      auth.userId,
      run.id,
      findings,
    );
    await completeInteractionRun(admin, run.id, { status: "completed" });
    return NextResponse.json({
      runId: run.id,
      status: "completed",
      findings: persisted,
      coverage: {
        factorsChecked: graph.factors.length,
        ddiRecords: knowledge.ddi.length,
        lifestyleRules: knowledge.rules.length,
      },
      safetyStatement: findings.some(
        (finding) => finding.findingType === "documented_concern",
      )
        ? "Documented concerns were found in the checked sources."
        : "No documented interaction was found in the checked sources for the items that could be identified. This does not mean the combination is safe.",
    });
  } catch (error) {
    return jsonError(
      "The interaction check could not be completed.",
      503,
      error instanceof Error ? error.message : undefined,
    );
  }
}

