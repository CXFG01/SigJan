import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260726120000_interaction_investigator.sql",
  ),
  "utf8",
);

describe("interaction investigator schema", () => {
  it("creates governed reference and patient-owned investigation tables", () => {
    for (const table of [
      "interaction_source_releases",
      "medicine_identity_cache",
      "ddi_interactions",
      "lifestyle_interaction_rules",
      "interaction_runs",
      "interaction_findings",
      "interaction_sources",
      "interaction_trace_events",
      "interaction_pair_reports",
    ]) {
      expect(migration).toContain(`create table public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("prevents patients from mutating knowledge or investigation audit records", () => {
    expect(migration).toContain(
      "revoke insert, update, delete on public.%I from authenticated, anon",
    );
    expect(migration).toContain("(select auth.uid()) = user_id");
    expect(migration).toContain("(select auth.jwt())->>''is_anonymous''");
  });

  it("restricts persisted trace events to the safe event vocabulary", () => {
    for (const event of [
      "run_started",
      "source_discovered",
      "reasoning_summary_delta",
      "validation_started",
      "finding_validated",
      "run_completed",
      "run_failed",
    ]) {
      expect(migration).toContain(`'${event}'`);
    }
    expect(migration).not.toContain("chain_of_thought");
  });

  it("ships the verified hackathon seed with attribution", () => {
    expect(migration).toContain("DDInter108-DDInter900");
    expect(migration).toContain("'Apixaban', 'apixaban'");
    expect(migration).toContain("'Ibuprofen', 'ibuprofen'");
    expect(migration).toContain("CC BY-NC-SA 4.0");
  });
});
