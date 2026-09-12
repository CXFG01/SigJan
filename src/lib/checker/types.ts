import { z } from "zod";
import type { InvestigationOutput } from "@/lib/interactions/schemas";

export const medicineSchema = z.object({
  name: z.string().trim().min(1).max(160),
  dose: z.string().trim().max(100).default(""),
  route: z.string().trim().max(80).default(""),
  frequency: z.string().trim().max(100).default(""),
}).strict();
export const checkSchema = z.object({
  medicines: z.array(medicineSchema).min(2).max(10),
  idempotencyKey: z.string().uuid(),
}).strict();
export type Medicine = z.infer<typeof medicineSchema>;
export type ResolvedMedicine = Medicine & { ingredients: string[]; identitySource: string };
export type Candidate = Medicine & { original: string; ingredients: string[]; identitySource: string; issue: string | null };
export type SourceFinding = {
  id: string; ingredients: [string, string]; severity: string;
  source: string; version: string; url: string; contextRequired?: boolean;
};
export type Coverage = { source: string; version: string; status: "available" | "unavailable" | "error"; records: number; message: string };
export type SourceResult = { findings: SourceFinding[]; coverage: Coverage[] };
export interface SourceAdapter { key: string; check(ingredients: string[]): Promise<SourceResult> }
export type ResearchState = "queued" | "running" | "completed" | "insufficient" | "failed" | "unavailable" | "timed_out" | "cancelled" | "skipped" | "not_needed";
export type Pair = {
  id: string; medicines: [ResolvedMedicine, ResolvedMedicine]; findings: SourceFinding[];
  duplicateIngredients: string[]; reason: "conflicting" | "incomplete" | "uncovered" | null;
  research: ResearchState; report?: InvestigationOutput; message?: string;
};
export type CheckResult = { pairs: Pair[]; coverage: Coverage[] };
export type PublicRun = CheckResult & { status: "running" | "completed" | "cancelled"; expiresAt: string };

const rank = { conflicting: 0, incomplete: 1, uncovered: 2 };
export function buildPairs(medicines: ResolvedMedicine[], sources: SourceResult): Pair[] {
  const pairs: Pair[] = [];
  for (let i = 0; i < medicines.length; i++) for (let j = i + 1; j < medicines.length; j++) {
    const left = medicines[i], right = medicines[j];
    const combinations = left.ingredients.flatMap(a => right.ingredients.map(b => [a, b].sort().join("::")));
    const findings = sources.findings.filter(f => combinations.includes([...f.ingredients].sort().join("::")));
    const duplicateIngredients = left.ingredients.filter(a => right.ingredients.includes(a));
    const conflicting = combinations.some(key => new Set(findings.filter(f => [...f.ingredients].sort().join("::") === key).map(f => f.severity).filter(s => s !== "unknown")).size > 1);
    const uncovered = combinations.some(key => !findings.some(f => [...f.ingredients].sort().join("::") === key) && key.split("::")[0] !== key.split("::")[1]);
    const reason = conflicting ? "conflicting" : findings.some(f => f.severity === "unknown" || f.contextRequired) || duplicateIngredients.length ? "incomplete" : uncovered ? "uncovered" : null;
    pairs.push({ id: `${i}-${j}`, medicines: [left, right], findings, duplicateIngredients, reason, research: reason ? "skipped" : "not_needed" });
  }
  pairs.filter(p => p.reason).sort((a, b) => rank[a.reason!] - rank[b.reason!]).slice(0, 3).forEach(p => { p.research = "queued"; });
  for (const p of pairs) if (p.research === "skipped") p.message = "Not investigated within this run (three-pair limit).";
  return pairs;
}
