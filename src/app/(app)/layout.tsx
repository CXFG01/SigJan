import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getSupabaseServerClient, requireUser } from "@/lib/supabase/server";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user) redirect("/auth");
  const supabase = await getSupabaseServerClient();
  const { data: profile } = await supabase!
    .from("health_profiles")
    .select("preferred_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  return (
    <div className="product-shell">
      <AppNav name={profile.preferred_name} />
      <main id="main-content" className="app-main">
        {children}
      </main>
    </div>
  );
}
