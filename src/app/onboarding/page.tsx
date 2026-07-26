import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { OnboardingForm } from "@/components/onboarding-form";
import { getSupabaseServerClient, requireUser } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (!user) redirect("/auth");
  const supabase = await getSupabaseServerClient();
  const { data: profile } = await supabase!
    .from("health_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile) redirect("/today");

  return (
    <main id="main-content" className="onboarding-page">
      <header className="onboarding-header"><Brand /></header>
      <OnboardingForm userId={user.id} />
    </main>
  );
}
