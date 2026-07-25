import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260725230527_patient_first_longitudinal_core.sql"),
  "utf8",
);

describe("longitudinal schema security", () => {
  it("creates the required patient-owned record tables", () => {
    for (const table of [
      "health_profiles", "source_artifacts", "intake_jobs", "extraction_runs",
      "candidate_facts", "health_items", "health_relationships", "fact_provenance",
      "medication_regimens", "schedule_segments", "dose_events", "calendar_events",
    ]) {
      expect(migration).toContain(`create table public.${table}`);
    }
  });

  it("denies anonymous health records and uses immutable owner checks", () => {
    expect(migration).toContain("revoke all on table public.%I from anon");
    expect(migration).toContain("(select auth.uid()) = user_id");
    expect(migration).toContain("with check ((select auth.uid()) = user_id");
    expect(migration).toContain("auth.jwt()->>'is_anonymous'");
  });

  it("keeps health source objects private and user-scoped", () => {
    expect(migration).toContain("'health-sources', 'health-sources', false");
    expect(migration).toContain("(storage.foldername(name))[1] = (select auth.uid()::text)");
  });

  it("makes confirmation a separate transactional operation", () => {
    expect(migration).toContain("confirm_intake_candidates");
    expect(migration).toContain("confirmation_state = 'candidate'");
    expect(migration).toContain("insert into public.health_items");
    expect(migration).toContain("grant execute on function public.confirm_intake_candidates");
    expect(migration).not.toMatch(/grant execute on function public\.confirm_intake_candidates[^;]+authenticated/i);
  });
});
