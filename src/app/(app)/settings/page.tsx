import { PageHeading } from "@/components/page-heading";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { SettingsActions } from "@/components/settings-actions";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const user = await requireUserOrRedirect();
  const supabase = await getSupabaseServerClient();
  const { data: profile } = await supabase!.from("health_profiles").select("*").eq("user_id", user.id).single();
  return (
    <>
      <PageHeading eyebrow="Your account" title="Settings" description="Manage your details, privacy choices, export, and deletion." />
      <div className="settings-layout">
        <section>
          <h2>Profile</h2>
          <p>Keep the details you entered during onboarding accurate. Optional health context stays under your control.</p>
          {profile ? <ProfileSettingsForm userId={user.id} profile={profile} /> : null}
        </section>
        <section>
          <div>
            <h2>Account and consent</h2>
            <dl className="detail-list">
              <div><dt>Email</dt><dd>{user?.email}</dd></div>
              <div><dt>Timezone</dt><dd>{profile?.timezone}</dd></div>
              <div><dt>Health-data consent</dt><dd>Given {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(profile?.health_data_consent_at))}</dd></div>
            </dl>
          </div>
          <div className="data-controls">
            <h2>Your data</h2>
            <p>Export a machine-readable copy, or permanently delete your account, private files, jobs, reminders, and derived records.</p>
            <SettingsActions />
          </div>
        </section>
      </div>
    </>
  );
}
