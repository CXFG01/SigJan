"use client";

import {
  getOrCreateSupabaseSession,
  getSupabaseBrowserClient,
} from "./client";

export async function loadDemoSessionState(): Promise<unknown | null> {
  const supabase = getSupabaseBrowserClient();
  const session = await getOrCreateSupabaseSession();
  if (!supabase || !session) {
    return null;
  }

  const { data, error } = await supabase
    .from("demo_sessions")
    .select("state")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.state ?? null;
}

export async function saveDemoSessionState(state: unknown): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const session = await getOrCreateSupabaseSession();
  if (!supabase || !session) {
    return;
  }

  const { error } = await supabase.from("demo_sessions").upsert(
    {
      user_id: session.user.id,
      state,
      schema_version: 1,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    throw error;
  }
}

export async function deleteDemoSessionState(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const session = await getOrCreateSupabaseSession();
  if (!supabase || !session) {
    return;
  }

  const { error } = await supabase
    .from("demo_sessions")
    .delete()
    .eq("user_id", session.user.id);
  if (error) {
    throw error;
  }
}

