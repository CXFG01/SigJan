import { NextResponse } from "next/server";
import { jsonError, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

async function listAllPaths(prefix: string): Promise<string[]> {
  const admin = getSupabaseAdminClient()!;
  const { data } = await admin.storage.from("health-sources").list(prefix, { limit: 1000 });
  const paths: string[] = [];
  for (const entry of data ?? []) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id) paths.push(path);
    else paths.push(...(await listAllPaths(path)));
  }
  return paths;
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to delete your account.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Account deletion is not configured.", 503);
  const paths = await listAllPaths(auth.userId);
  if (paths.length) {
    const { error } = await admin.storage.from("health-sources").remove(paths);
    if (error) return jsonError("Private files could not be deleted, so your account was left intact.", 500);
  }
  const { error } = await admin.auth.admin.deleteUser(auth.userId);
  if (error) return jsonError("Your account was not deleted.", 500);
  return new NextResponse(null, { status: 204 });
}
