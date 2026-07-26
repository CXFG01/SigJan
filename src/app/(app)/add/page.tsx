import { AddFlow, type AddFlowJob } from "@/components/add-flow";
import { PageHeading } from "@/components/page-heading";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const user = await requireUserOrRedirect();
  const { review } = await searchParams;
  let initialJob: AddFlowJob | null = null;
  if (review === "1") {
    const supabase = await getSupabaseServerClient();
    const { data: candidates } = await supabase!
      .from("candidate_facts")
      .select("id, intake_job_id, item_type, original_wording, normalized_wording, details, confidence, uncertainty, created_at")
      .eq("user_id", user.id)
      .eq("confirmation_state", "candidate")
      .order("created_at", { ascending: false })
      .limit(100);
    const jobId = candidates?.[0]?.intake_job_id;
    if (jobId) {
      const { data: job } = await supabase!
        .from("intake_jobs")
        .select("id, status, failure_detail, progress_stage, progress_detail, progress_updated_at, created_at, started_at, completed_at, attempt_count")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (job) {
        initialJob = {
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
          candidates: (candidates ?? [])
            .filter((candidate) => candidate.intake_job_id === job.id)
            .map((candidate) => ({
              id: candidate.id,
              itemType: candidate.item_type,
              originalWording: candidate.original_wording,
              normalizedWording: candidate.normalized_wording,
              details: candidate.details,
              confidence: Number(candidate.confidence),
              uncertainty: candidate.uncertainty,
            })),
        };
      }
    }
  }
  return (
    <>
      <PageHeading eyebrow="One gentle intake" title="Add to your record" description="Use whatever format is easiest. SignalRx will organise it into suggestions for you to check." />
      <AddFlow userId={user.id} initialJob={initialJob} />
    </>
  );
}
