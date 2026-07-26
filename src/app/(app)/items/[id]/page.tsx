import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, GitBranch, ShieldQuestion } from "lucide-react";
import { itemTypeLabels, type HealthItemType } from "@/lib/health/labels";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserOrRedirect();
  const supabase = await getSupabaseServerClient();
  const [{ data: item }, { data: provenance }, { data: relationships }] = await Promise.all([
    supabase!.from("health_items").select("*").eq("user_id", user.id).eq("id", id).maybeSingle(),
    supabase!.from("fact_provenance").select("*").eq("user_id", user.id).eq("health_item_id", id).order("confirmed_at", { ascending: false }),
    supabase!.from("health_relationships").select("*").eq("user_id", user.id).or(`from_item_id.eq.${id},to_item_id.eq.${id}`),
  ]);
  if (!item) notFound();
  const infoHref = `/api/content/${item.item_type}/${encodeURIComponent(item.dmd_code || item.normalized_name)}`;
  return (
    <>
      <Link href="/library" className="back-link"><ArrowLeft size={18} /> Back to library</Link>
      <header className="item-header">
        <div><p className="eyebrow">{itemTypeLabels[item.item_type as HealthItemType]}</p><h1>{item.display_name}</h1><p>{item.status} · confirmed {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(item.confirmed_at))}</p></div>
        <span className={`match-state state-${item.dmd_match_state}`}>{item.dmd_match_state === "matched" ? "NHS dm+d matched" : "Not authoritatively matched"}</span>
      </header>
      <div className="item-columns">
        <section>
          <div className="section-line-heading"><div><p className="eyebrow">Details</p><h2>What you confirmed</h2></div></div>
          <dl className="detail-list">
            <div><dt>Original name</dt><dd>{item.display_name}</dd></div>
            <div><dt>Normalised name</dt><dd>{item.normalized_name}</dd></div>
            {Object.entries(item.details ?? {}).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{String(value)}</dd></div>)}
            <div><dt>Date range</dt><dd>{item.starts_on || "Not known"} – {item.ends_on || "Ongoing or not known"}</dd></div>
          </dl>
          <Link className="button button-secondary" href={infoHref}><ExternalLink size={18} /> Open authoritative information</Link>
        </section>
        <aside>
          <section className="provenance-panel">
            <FileText size={24} /><h2>Sources</h2>
            {provenance?.length ? <ol>{provenance.map((source) => <li key={source.id}><strong>{source.original_wording}</strong><p>{source.source_excerpt || "No excerpt retained"}</p><small>{source.extraction_method || "Direct entry"} · confirmed by you</small></li>)}</ol> : <p>This was entered directly. No source file is linked.</p>}
          </section>
          <section className="relationship-panel">
            <GitBranch size={24} /><h2>Relationships</h2>
            {relationships?.length ? <ul>{relationships.map((edge) => <li key={edge.id}>{edge.relationship_type.replaceAll("_", " ")} <small>{edge.certainty}</small></li>)}</ul> : <p>No confirmed relationships yet.</p>}
            <p className="certainty-note"><ShieldQuestion size={17} /> Relationships describe reports, documents, measurements, or timing—not interaction or cause.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
