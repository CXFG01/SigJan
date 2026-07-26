import { NextResponse } from "next/server";
import { confirmationSchema } from "@/lib/health/schemas";
import { jsonError, requireJson, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to confirm facts.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  if (!requireJson(request)) return jsonError("Send JSON.", 415);
  const parsed = confirmationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check your confirmation choices.", 400, parsed.error.flatten());
  const { id } = await params;
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Confirmation is not configured.", 503);
  const { data, error } = await admin.rpc("confirm_intake_candidates", {
    owner_id: auth.userId,
    target_job_id: id,
    decisions: parsed.data.decisions,
  });
  if (error) return jsonError("No changes were made. Please review and try again.", 400);
  return NextResponse.json({ confirmed: data });
}
