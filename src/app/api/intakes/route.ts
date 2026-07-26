import { after, NextResponse } from "next/server";
import { intakeCreateSchema } from "@/lib/health/schemas";
import { jsonError, requireJson, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to view your intake.", 401);
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Secure intake processing is not configured.", 503);

  const { data: latest, error } = await admin
    .from("intake_jobs")
    .select("id")
    .eq("user_id", auth.userId)
    .in("status", ["queued", "processing", "needs_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return jsonError("Your active intake could not be checked.", 500);
  if (!latest) return new NextResponse(null, { status: 204 });
  return NextResponse.json(latest);
}

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to create an intake.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  if (!requireJson(request)) return jsonError("Send JSON with content-type application/json.", 415);
  const parsed = intakeCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the intake details.", 400, parsed.error.flatten());
  const idempotencyKey = request.headers.get("x-idempotency-key");
  if (!idempotencyKey || idempotencyKey.length > 200) return jsonError("A valid idempotency key is required.", 400);
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Secure intake processing is not configured.", 503);

  const { data: existing } = await admin
    .from("intake_jobs")
    .select("id, status")
    .eq("user_id", auth.userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) return NextResponse.json(existing);

  let textArtifactId: string | null = null;
  if (parsed.data.text?.trim()) {
    const { data, error } = await admin
      .from("source_artifacts")
      .insert({
        user_id: auth.userId,
        kind: parsed.data.mode === "realtime_voice" ? "realtime_voice" : "text",
        original_text: parsed.data.text.trim(),
      })
      .select("id")
      .single();
    if (error) return jsonError("The text source could not be secured.", 500);
    textArtifactId = data.id;
  }

  if (parsed.data.artifacts.length) {
    const { error } = await admin.from("source_artifacts").insert(
      parsed.data.artifacts.map((artifact) => ({
        id: artifact.id,
        user_id: auth.userId,
        kind: parsed.data.mode,
        file_name: artifact.fileName,
        mime_type: artifact.mimeType,
        size_bytes: artifact.sizeBytes,
        storage_path: artifact.storagePath,
        sha256: artifact.sha256 ?? null,
      })),
    );
    if (error && error.code !== "23505") return jsonError("File metadata could not be secured.", 500);
  }

  const { data: job, error: jobError } = await admin
    .from("intake_jobs")
    .insert({
      user_id: auth.userId,
      mode: parsed.data.mode,
      idempotency_key: idempotencyKey,
    })
    .select("id, status")
    .single();
  if (jobError) return jsonError("The intake job could not be created.", 500);

  const artifactIds = [
    ...(textArtifactId ? [textArtifactId] : []),
    ...parsed.data.artifacts.map((artifact) => artifact.id),
  ];
  if (artifactIds.length) {
    const { error } = await admin.from("intake_job_artifacts").insert(
      artifactIds.map((artifactId) => ({
        user_id: auth.userId,
        intake_job_id: job.id,
        artifact_id: artifactId,
      })),
    );
    if (error) return jsonError("Sources could not be linked to the intake.", 500);
  }
  const { error: queueError } = await admin.rpc("enqueue_intake_job", {
    job_id: job.id,
    owner_id: auth.userId,
  });
  if (queueError) {
    await admin.from("intake_jobs").update({ status: "failed", failure_code: "queue_unavailable" }).eq("id", job.id);
    return jsonError("Secure processing is temporarily unavailable. Your sources remain private.", 503);
  }
  after(async () => {
    await admin.functions.invoke("process-intakes", {
      body: { requestedJobId: job.id },
      headers: {
        "x-signalrx-worker-token": process.env.INTAKE_WORKER_TOKEN ?? "",
      },
    });
  });
  return NextResponse.json(job, { status: 202 });
}
