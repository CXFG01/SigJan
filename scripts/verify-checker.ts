import { readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { getSupabaseAdminClient } from "../src/lib/supabase/admin";
import { extractMedicines } from "../src/lib/checker/extraction";
import { resolveMedicine } from "../src/lib/checker/identity";
import { checkSources, ddinterAdapter } from "../src/lib/checker/sources";
import { buildPairs } from "../src/lib/checker/types";
Object.assign(process.env, parseEnv(readFileSync(".env.local", "utf8")));
async function main() {
  const db = getSupabaseAdminClient(); if (!db) throw new Error("Server database key missing.");
  const extracted = await extractMedicines("Apixaban 5 mg oral twice daily\nIbuprofen 200 mg oral as needed\nCo-codamol 8/500 mg oral as needed");
  console.log("Synthetic extraction returned", extracted.map(m => m.name).join(", "));
  const resolved = await Promise.all(extracted.map(({ name, dose, route, frequency }) => resolveMedicine(db, { name, dose, route, frequency })));
  if (resolved.some(m => !m)) throw new Error("Synthetic identity resolution failed: " + extracted.filter((_,i) => !resolved[i]).map(m => m.name).join(", "));
  const medicines = resolved.filter(m => m !== null);
  const sources = await checkSources([ddinterAdapter(db)], medicines.flatMap(m => m.ingredients));
  const pairs = buildPairs(medicines, sources);
  const summary = { checkedAt: new Date().toISOString(), extraction: medicines, coverage: sources.coverage, pairs: pairs.map(p => ({ medicines: p.medicines.map(m => m.name), findings: p.findings.length, reason: p.reason })) };
  writeFileSync(".qa/checker-verification.json", JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ medicines: medicines.length, pairs: pairs.length, sourceRecords: sources.coverage.map(c => c.records), findings: sources.findings.length }));
}
main().catch(error => { console.error(error instanceof Error ? error.message.slice(0,600) : "Synthetic verification failed."); process.exitCode = 1; });
