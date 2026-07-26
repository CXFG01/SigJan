import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to view investigation progress.", 401);
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Evidence investigation is not configured.", 503);
  const { id } = await params;
  const after = Number(new URL(request.url).searchParams.get("after") ?? 0);
  if (!Number.isInteger(after) || after < 0) {
    return jsonError("The event cursor is invalid.", 400);
  }
  const { data: run } = await admin
    .from("interaction_runs")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!run) return jsonError("The investigation was not found.", 404);
  const { data, error } = await admin
    .from("interaction_trace_events")
    .select("sequence,event_type,payload,created_at")
    .eq("run_id", id)
    .eq("user_id", auth.userId)
    .gt("sequence", after)
    .order("sequence");
  if (error) return jsonError("Investigation progress could not be loaded.", 503);
  return NextResponse.json({ runId: id, events: data ?? [] });
}

