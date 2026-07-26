import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DeterministicFinding,
  DdiKnowledge,
  LifestyleRule,
} from "./deterministic";
import type { PrivacySafeGraph } from "./graph";
import { interactionPairKey } from "./normalization";
import {
  classifySource,
  domainForUrl,
  PROMPT_VERSION,
  SOURCE_POLICY_VERSION,
} from "./policy";
import type {
  InteractionRunKind,
  InvestigationEventType,
  InvestigationOutput,
} from "./schemas";

const DEFAULT_MODEL = "gpt-5.6-sol";

export async function loadInteractionKnowledge(admin: SupabaseClient) {
  const [{ data: ddi, error: ddiError }, { data: rules, error: ruleError }] =
    await Promise.all([
      admin
        .from("ddi_interactions")
        .select(
          "id,external_record_id,factor_a_normalized,factor_b_normalized,severity,interaction_source_releases(source_key,version,source_url)",
        ),
      admin
        .from("lifestyle_interaction_rules")
        .select(
          "id,version,factor_a_normalized,factor_b_normalized,title,severity,concern,source_url,source_organization,jurisdiction",
        )
        .eq("active", true),
    ]);
  if (ddiError) throw new Error(`ddi_knowledge_unavailable:${ddiError.code}`);
  if (ruleError) throw new Error(`lifestyle_rules_unavailable:${ruleError.code}`);
  return {
    ddi: (ddi ?? []) as unknown as DdiKnowledge[],
    rules: (rules ?? []) as LifestyleRule[],
  };
}

export async function createInteractionRun(
  admin: SupabaseClient,
  input: {
    userId: string;
    kind: InteractionRunKind;
    graph: PrivacySafeGraph;
    graphHash: string;
    assessmentTime?: string;
    model?: string | null;
  },
) {
  const { data, error } = await admin
    .from("interaction_runs")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      status: "running",
      assessment_time: input.assessmentTime ?? input.graph.asOf,
      graph_snapshot: input.graph,
      graph_snapshot_hash: input.graphHash,
      model: input.model ?? null,
      prompt_version: PROMPT_VERSION,
      source_policy_version: SOURCE_POLICY_VERSION,
      started_at: new Date().toISOString(),
    })
    .select("id,status,kind,created_at")
    .single();
  if (error) throw new Error(`interaction_run_create_failed:${error.code}`);
  return data;
}

export async function persistDeterministicFindings(
  admin: SupabaseClient,
  userId: string,
  runId: string,
  findings: DeterministicFinding[],
) {
  if (!findings.length) return [];
  const { data, error } = await admin
    .from("interaction_findings")
    .insert(
      findings.map((finding) => ({
        run_id: runId,
        user_id: userId,
        finding_type: finding.findingType,
        trigger_type: finding.triggerType,
        factor_refs: finding.factorRefs,
        factor_names: finding.factorNames,
        canonical_names: finding.canonicalNames,
        source_severity: finding.sourceSeverity,
        deterministic_source: finding.deterministicSource,
        publication_status:
          finding.findingType === "documented_concern" ? "validated" : "pending",
      })),
    )
    .select("*");
  if (error) throw new Error(`interaction_findings_create_failed:${error.code}`);
  return data ?? [];
}

export async function appendTraceEvent(
  admin: SupabaseClient,
  event: {
    runId: string;
    userId: string;
    sequence: number;
    type: InvestigationEventType;
    payload?: Record<string, unknown>;
  },
) {
  const { error } = await admin.from("interaction_trace_events").insert({
    run_id: event.runId,
    user_id: event.userId,
    sequence: event.sequence,
    event_type: event.type,
    payload: event.payload ?? {},
  });
  if (error) throw new Error(`interaction_trace_write_failed:${error.code}`);
}

export async function completeInteractionRun(
  admin: SupabaseClient,
  runId: string,
  input: {
    status: "completed" | "failed" | "interrupted";
    validationFailures?: string[];
    failureCode?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    latencyMs?: number | null;
  },
) {
  const { error } = await admin
    .from("interaction_runs")
    .update({
      status: input.status,
      validation_failures: input.validationFailures ?? [],
      failure_code: input.failureCode ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      latency_ms: input.latencyMs ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
  if (error) throw new Error(`interaction_run_update_failed:${error.code}`);
}

export async function persistInvestigationOutput(
  admin: SupabaseClient,
  input: {
    userId: string;
    runId: string;
    output: InvestigationOutput;
    baseFindingIds?: string[];
  },
) {
  const findingIds: string[] = [];
  for (const [index, report] of input.output.reports.entries()) {
    const existingId = input.baseFindingIds?.[index];
    let findingId = existingId;
    if (existingId) {
      const { error } = await admin
        .from("interaction_findings")
        .update({
          evidence_state: report.evidenceState,
          evidence_strength: report.evidenceStrength,
          structured_brief: report,
          publication_status: "validated",
        })
        .eq("id", existingId)
        .eq("user_id", input.userId);
      if (error) throw new Error(`interaction_finding_update_failed:${error.code}`);
    } else {
      const { data, error } = await admin
        .from("interaction_findings")
        .insert({
          run_id: input.runId,
          user_id: input.userId,
          finding_type: report.findingType,
          trigger_type: report.triggerType,
          factor_refs: [],
          factor_names: report.factors.map((factor) => factor.name),
          canonical_names: report.factors.map((factor) => factor.canonicalName),
          source_severity: report.sourceSeverity,
          evidence_state: report.evidenceState,
          evidence_strength: report.evidenceStrength,
          structured_brief: report,
          publication_status: "validated",
        })
        .select("id")
        .single();
      if (error) throw new Error(`interaction_finding_create_failed:${error.code}`);
      findingId = data.id;
    }
    findingIds.push(findingId!);

    const { error: sourceError } = await admin.from("interaction_sources").insert(
      report.sources.map((source) => ({
        run_id: input.runId,
        finding_id: findingId,
        user_id: input.userId,
        source_ref: source.ref,
        url: source.url,
        title: source.title,
        organization: source.organization,
        domain: domainForUrl(source.url),
        source_type: classifySource(source.url),
        jurisdiction: source.jurisdiction,
        publication_or_update_date: source.publicationOrUpdateDate,
      })),
    );
    if (sourceError) throw new Error(`interaction_sources_create_failed:${sourceError.code}`);
  }
  return findingIds;
}

export async function getCachedPairReport(
  admin: SupabaseClient,
  left: string,
  right: string,
  jurisdiction: string,
) {
  const pairKey = interactionPairKey(left, right);
  const { data } = await admin
    .from("interaction_pair_reports")
    .select("report,source_urls,created_at")
    .eq("pair_key", pairKey)
    .eq("jurisdiction", jurisdiction)
    .eq("prompt_version", PROMPT_VERSION)
    .eq("source_policy_version", SOURCE_POLICY_VERSION)
    .eq("validation_status", "validated")
    .is("superseded_at", null)
    .maybeSingle();
  return data as
    | { report: InvestigationOutput; source_urls: string[]; created_at: string }
    | null;
}

export async function cachePairReport(
  admin: SupabaseClient,
  input: {
    left: string;
    right: string;
    jurisdiction: string;
    output: InvestigationOutput;
    sourceUrls: string[];
  },
) {
  const [factorA, factorB] = [input.left, input.right].sort();
  const { error } = await admin.from("interaction_pair_reports").upsert(
    {
      pair_key: interactionPairKey(factorA, factorB),
      factor_a_normalized: factorA,
      factor_b_normalized: factorB,
      jurisdiction: input.jurisdiction,
      model: process.env.OPENAI_INTERACTION_MODEL ?? DEFAULT_MODEL,
      prompt_version: PROMPT_VERSION,
      source_policy_version: SOURCE_POLICY_VERSION,
      report: input.output,
      source_urls: input.sourceUrls,
      validation_status: "validated",
    },
    {
      onConflict: "pair_key,jurisdiction,prompt_version,source_policy_version",
    },
  );
  if (error) throw new Error(`interaction_pair_cache_failed:${error.code}`);
}

export async function getOwnedRun(
  admin: SupabaseClient,
  userId: string,
  runId: string,
) {
  const { data, error } = await admin
    .from("interaction_runs")
    .select(
      "id,kind,status,assessment_time,model,prompt_version,source_policy_version,validation_failures,failure_code,latency_ms,created_at,completed_at,interaction_findings(*,interaction_sources(*))",
    )
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`interaction_run_read_failed:${error.code}`);
  return data;
}

export async function getOwnedFinding(
  admin: SupabaseClient,
  userId: string,
  findingId: string,
) {
  const { data, error } = await admin
    .from("interaction_findings")
    .select("*")
    .eq("id", findingId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`interaction_finding_read_failed:${error.code}`);
  return data;
}
