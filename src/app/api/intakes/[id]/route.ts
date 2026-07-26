import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getSupabaseServerClient, requireUser } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return jsonError("Sign in to view this intake.", 401);
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const [{ data: job }, { data: candidates }] = await Promise.all([
    supabase!
      .from("intake_jobs")
      .select(
        "id, status, failure_detail, progress_stage, progress_detail, progress_updated_at, created_at, started_at, completed_at, attempt_count",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase!.from("candidate_facts").select("id, item_type, original_wording, normalized_wording, details, confidence, uncertainty").eq("intake_job_id", id).eq("user_id", user.id).eq("confirmation_state", "candidate").order("created_at"),
  ]);
  if (!job) return jsonError("Intake not found.", 404);
  return NextResponse.json({
    id: job.id,
    status: job.status,
    failureDetail: job.failure_detail,
    progressStage: job.progress_stage,
    progressDetail: job.progress_detail,
    progressUpdatedAt: job.progress_updated_at,
    createdAt: job.created_at,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    attemptCount: job.attempt_count,
    candidates: (candidates ?? []).map((candidate) => ({
      id: candidate.id,
      itemType: candidate.item_type,
      originalWording: candidate.original_wording,
      normalizedWording: candidate.normalized_wording,
      details: candidate.details,
      confidence: Number(candidate.confidence),
      uncertainty: candidate.uncertainty,
    })),
  });
}
