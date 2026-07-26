import { NextResponse } from "next/server";
import { getOwnedRun } from "@/lib/interactions/repository";
import { jsonError } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to view an investigation.", 401);
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Evidence investigation is not configured.", 503);
  const { id } = await params;
  const run = await getOwnedRun(admin, auth.userId, id);
  if (!run) return jsonError("The investigation was not found.", 404);
  return NextResponse.json(run);
}

