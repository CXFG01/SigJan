import { AddFlow } from "@/components/add-flow";
import { PageHeading } from "@/components/page-heading";
import { requireUserOrRedirect } from "@/lib/supabase/server";

export default async function AddPage() {
  const user = await requireUserOrRedirect();
  return (
    <>
      <PageHeading eyebrow="One gentle intake" title="Add to your record" description="Use whatever format is easiest. SignalRx will organise it into suggestions for you to check." />
      <AddFlow userId={user.id} />
    </>
  );
}
