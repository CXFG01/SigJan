import Link from "next/link";
import { ArrowUpRight, BookOpen, CirclePlus, Search } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { itemTypeLabels, type HealthItemType } from "@/lib/health/labels";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUserOrRedirect();
  const supabase = await getSupabaseServerClient();
  const { data: items } = await supabase!
    .from("health_items")
    .select("id, display_name, item_type, status, dmd_match_state, updated_at")
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("display_name");
  return (
    <>
      <PageHeading eyebrow="Record and information" title="Library" description="Your confirmed health items, kept separate from general NHS and MHRA information." action={<Link href="/add" className="button button-primary"><CirclePlus size={18} /> Add information</Link>} />
      <section className="portal-search" aria-labelledby="portal-heading">
        <BookOpen size={25} aria-hidden="true" />
        <div><h2 id="portal-heading">Find authoritative information</h2><p>Search NHS medicines, conditions, symptoms, tests, and treatments.</p></div>
        <form action="/library" className="inline-search">
          <label className="sr-only" htmlFor="library-search">Search authoritative information</label>
          <input id="library-search" name="q" placeholder="Medicine or condition" />
          <button className="button button-secondary"><Search size={18} /> Search</button>
        </form>
      </section>
      <section className="library-record" aria-labelledby="record-heading">
        <div className="section-line-heading"><div><p className="eyebrow">Personal</p><h2 id="record-heading">Your record</h2></div></div>
        {items?.length ? (
          <ul className="library-list">
            {items.map((item) => (
              <li key={item.id}>
                <div><p>{itemTypeLabels[item.item_type as HealthItemType]}</p><Link href={`/items/${item.id}`}><h3>{item.display_name}</h3></Link></div>
                <span className={`match-state state-${item.dmd_match_state}`}>{item.dmd_match_state === "matched" ? "NHS dm+d matched" : item.dmd_match_state.replaceAll("_", " ")}</span>
                <Link href={`/items/${item.id}`} aria-label={`Open ${item.display_name}`}><ArrowUpRight /></Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="teaching-empty"><h3>Your library is empty</h3><p>Confirmed facts from text, voice, photos, and documents will appear here.</p><Link href="/add" className="button button-secondary">Add your first item</Link></div>
        )}
      </section>
      <p className="coverage-note">For supplements or herbs without authoritative UK coverage, SignalRx shows the gap and links outward. It does not invent a summary.</p>
    </>
  );
}
