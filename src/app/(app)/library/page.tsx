import Link from "next/link";
import { ArrowUpRight, BookOpen, CirclePlus, Search } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { itemTypeLabels, type HealthItemType } from "@/lib/health/labels";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUserOrRedirect();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await getSupabaseServerClient();
  let itemQuery = supabase!
    .from("health_items")
    .select("id, display_name, item_type, status, dmd_match_state, updated_at")
    .eq("user_id", user.id)
    .neq("status", "archived");
  if (query) itemQuery = itemQuery.ilike("display_name", `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  const { data: items } = await itemQuery.order("display_name");
  return (
    <>
      <PageHeading eyebrow="Record and information" title="Library" description="Your confirmed health items, kept separate from general NHS and MHRA information." action={<Link href="/add" className="button button-primary"><CirclePlus size={18} /> Add information</Link>} />
      <section className="portal-search" aria-labelledby="portal-heading">
        <BookOpen size={25} aria-hidden="true" />
        <div><h2 id="portal-heading">Find health information</h2><p>Search your record first, then continue to the NHS website for general guidance.</p></div>
        <form action="/library" className="inline-search">
          <label className="sr-only" htmlFor="library-search">Search your record</label>
          <input id="library-search" name="q" placeholder="Medicine or condition" defaultValue={query} />
          <button className="button button-secondary"><Search size={18} /> Search</button>
        </form>
        {query ? (
          <a
            className="text-link portal-external"
            href={`https://www.nhs.uk/search/results?q=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noreferrer"
          >
            Search NHS for “{query}” <ArrowUpRight size={17} />
          </a>
        ) : null}
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
        ) : query ? (
          <div className="teaching-empty"><h3>No matches in your record</h3><p>Try a shorter search, add the item, or continue to the NHS website above.</p><Link href="/library" className="button button-secondary">Clear search</Link></div>
        ) : (
          <div className="teaching-empty"><h3>Your library is empty</h3><p>Confirmed facts from text, voice, photos, and documents will appear here.</p><Link href="/add" className="button button-secondary">Add your first item</Link></div>
        )}
      </section>
      <p className="coverage-note">For supplements or herbs without authoritative UK coverage, SignalRx shows the gap and links outward. It does not invent a summary.</p>
    </>
  );
}
