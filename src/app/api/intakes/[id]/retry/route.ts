import { after, NextResponse } from "next/server";
import { jsonError, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Sign in to retry this intake.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  const { id } = await params;
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Secure intake processing is not configured.", 503);

  const { data: job, error } = await admin
    .from("intake_jobs")
    .select("id, status, attempt_count, progress_stage")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return jsonError("This intake could not be checked.", 500);
  if (!job) return jsonError("Intake not found.", 404);
  if (job.status !== "queued" || job.progress_stage !== "retrying") {
    return NextResponse.json({ id: job.id, status: job.status });
  }
  if (job.attempt_count >= 3) {
    return jsonError("This intake has reached its retry limit.", 409);
  }

  after(async () => {
    await admin.functions.invoke("process-intakes", {
      body: { requestedJobId: job.id },
      headers: {
        "x-signalrx-worker-token": process.env.INTAKE_WORKER_TOKEN ?? "",
      },
    });
  });
  return NextResponse.json({ id: job.id, status: "queued" }, { status: 202 });
}
