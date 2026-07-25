import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseConfig } from "./config";

export async function getSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes them.
        }
      },
    },
  });
}

export async function requireUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user || data.user.is_anonymous ? null : data.user;
}

export async function requireUserOrRedirect() {
  const user = await requireUser();
  if (!user) redirect("/auth");
  return user;
}

export async function authenticateRequest() {
  const user = await requireUser();
  return user ? { userId: user.id, email: user.email ?? null } : null;
}
