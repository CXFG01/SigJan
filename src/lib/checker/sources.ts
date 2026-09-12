import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceAdapter, SourceResult } from "./types";

export function ddinterAdapter(db: SupabaseClient): SourceAdapter {
  return { key: "ddinter", async check(ingredients) {
    try {
      const releases = await db.from("interaction_source_releases").select("id,version,source_url,record_count").eq("source_key", "ddinter").eq("active", true);
      if (releases.error) throw releases.error;
      if (!releases.data?.length) return { findings: [], coverage: [{ source: "DDInter", version: "none", records: 0, status: "unavailable", message: "No active DDInter dataset is configured." }] };
      const findings: SourceResult["findings"] = [], coverage: SourceResult["coverage"] = [];
      for (const release of releases.data) {
        const count = await db.from("ddi_interactions").select("id", { count: "exact", head: true }).eq("source_release_id", release.id);
        if (count.error) throw count.error;
        coverage.push({ source: "DDInter", version: release.version, records: count.count ?? 0, status: count.count ? "available" : "unavailable", message: count.count ? "Imported records checked; missing pairs remain unknown." : "This source release contains no records." });
        // Paginate deterministically; never silently truncate a source's evidence.
        const unique = [...new Set(ingredients)].sort();
        for (let offset = 0; ; offset += 500) {
          const result = await db.from("ddi_interactions").select("id,factor_a_normalized,factor_b_normalized,severity").eq("source_release_id", release.id).in("factor_a_normalized", unique).in("factor_b_normalized", unique).order("id").range(offset, offset + 499);
          if (result.error) throw result.error;
          for (const row of result.data ?? []) findings.push({ id: row.id, ingredients: [row.factor_a_normalized, row.factor_b_normalized], severity: row.severity.toLowerCase(), source: "DDInter", version: release.version, url: release.source_url });
          if ((result.data?.length ?? 0) < 500) break;
        }
      }
      return { findings, coverage };
    } catch {
      return { findings: [], coverage: [{ source: "DDInter", version: "unknown", records: 0, status: "error", message: "Database lookup failed. Coverage is unavailable, not a negative result." }] };
    }
  } };
}

export async function checkSources(adapters: SourceAdapter[], ingredients: string[]): Promise<SourceResult> {
  const results = await Promise.all(adapters.map(async a => {
    try { return await a.check(ingredients); } catch { return { findings: [], coverage: [{ source: a.key, version: "unknown", records: 0, status: "error" as const, message: "Source unavailable." }] }; }
  }));
  return { findings: results.flatMap(r => r.findings), coverage: results.flatMap(r => r.coverage) };
}
