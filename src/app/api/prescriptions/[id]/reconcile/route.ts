import { NextResponse } from "next/server";
import { jsonError, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to reconcile a prescription.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  const { id } = await params;
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Reconciliation is not configured.", 503);
  const [{ data: candidates }, { data: active }] = await Promise.all([
    admin.from("candidate_facts").select("*").eq("user_id", auth.userId).eq("intake_job_id", id).in("item_type", ["prescribed_medication", "otc_medication"]),
    admin.from("health_items").select("id, display_name, normalized_name, dmd_code, details").eq("user_id", auth.userId).eq("status", "active").in("item_type", ["prescribed_medication", "otc_medication"]),
  ]);
  if (!candidates?.length) return jsonError("No medicine candidates were found in this prescription.", 400);
  const proposals = candidates.map((candidate) => {
    const exact = active?.find((item) =>
      (candidate.details?.dmd_code && item.dmd_code === candidate.details.dmd_code) ||
      item.normalized_name.toLowerCase() === candidate.normalized_wording.toLowerCase(),
    );
    if (!exact) return { candidateId: candidate.id, action: "add", existingItemId: null, reason: "No confirmed identity match." };
    const sameRegimen = ["strength", "route", "schedule"].every((field) =>
      !candidate.details?.[field] || candidate.details[field] === exact.details?.[field],
    );
    return {
      candidateId: candidate.id,
      existingItemId: exact.id,
      action: sameRegimen ? "duplicate" : "change",
      reason: sameRegimen ? "Same identity and stated regimen fields." : "Same identity with different regimen fields.",
    };
  });
  const { data, error } = await admin.from("prescription_reconciliations").insert({
    user_id: auth.userId,
    intake_job_id: id,
    proposal: { proposals, automaticChanges: false },
  }).select("id, proposal, status").single();
  if (error) return jsonError("A reconciliation proposal could not be created.", 500);
  return NextResponse.json(data, { status: 201 });
}
