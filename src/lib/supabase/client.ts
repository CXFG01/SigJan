"use client";

import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;
let sessionPromise: Promise<Session | null> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
  return browserClient;
}

export function getOrCreateSupabaseSession(): Promise<Session | null> {
  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return null;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      return session;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw error;
    }
    return data.session;
  })().catch(() => {
    sessionPromise = null;
    return null;
  });

  return sessionPromise;
}
