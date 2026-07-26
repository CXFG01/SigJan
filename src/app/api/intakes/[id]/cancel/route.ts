import { NextResponse } from "next/server";
import { jsonError, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Sign in to stop this intake.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  const { id } = await params;
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Secure intake processing is not configured.", 503);

  const { data: job, error } = await admin
    .from("intake_jobs")
    .update({
      status: "failed",
      progress_stage: "failed",
      progress_detail: "Processing was stopped. Nothing was added to your record.",
      progress_updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      failure_code: "cancelled_by_patient",
      failure_detail: "Processing was stopped. No suggested fact was added to your record.",
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", ["queued", "processing"])
    .select("id, status, failure_detail, progress_stage, progress_detail, progress_updated_at, created_at, started_at, completed_at, attempt_count")
    .maybeSingle();

  if (error) return jsonError("This intake could not be stopped.", 500);
  if (!job) return jsonError("This intake is no longer being processed.", 409);
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
    candidates: [],
  });
}
