import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeterministicFinding } from "./deterministic";
import type { PrivacySafeGraph } from "./graph";
import { normalizeFactorName } from "./normalization";
import {
  runInteractionInvestigator,
  type InvestigatorInput,
} from "./investigator";
import {
  appendTraceEvent,
  cachePairReport,
  completeInteractionRun,
  getCachedPairReport,
  persistInvestigationOutput,
} from "./repository";
import type {
  InvestigationEventType,
  InvestigationProgressEvent,
} from "./schemas";

const encoder = new TextEncoder();

function sse(event: InvestigationProgressEvent) {
  return encoder.encode(
    `id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
  );
}

export function createInvestigationStream(input: {
  request: Request;
  admin: SupabaseClient;
  userId: string;
  runId: string;
  graph: PrivacySafeGraph;
  mode: InvestigatorInput["mode"];
  deterministicFindings: DeterministicFinding[];
  baseFindingIds?: string[];
  pair?: { factorA: string; factorB: string };
  jurisdiction: string;
}) {
  let sequence = 0;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = async (
        type: InvestigationEventType,
        payload: Record<string, unknown> = {},
      ) => {
        sequence += 1;
        const event: InvestigationProgressEvent = {
          runId: input.runId,
          sequence,
          type,
          at: new Date().toISOString(),
          payload,
        };
        await appendTraceEvent(input.admin, {
          runId: input.runId,
          userId: input.userId,
          sequence,
          type,
          payload,
        });
        controller.enqueue(sse(event));
      };

      void (async () => {
        try {
          await emit("run_started", {
            mode: input.mode,
            deterministicFindings: input.deterministicFindings,
          });
          await emit("graph_prepared", {
            factorCount: input.graph.factors.length,
            relationshipCount: input.graph.relationships.length,
            directIdentifiersRemoved: true,
          });
          if (input.pair) {
            await emit("factor_pair_selected", {
              factorA: input.pair.factorA,
              factorB: input.pair.factorB,
            });
            const cached = await getCachedPairReport(
              input.admin,
              input.pair.factorA,
              input.pair.factorB,
              input.jurisdiction,
            );
            if (cached) {
              const ids = await persistInvestigationOutput(input.admin, {
                userId: input.userId,
                runId: input.runId,
                output: cached.report,
                baseFindingIds: input.baseFindingIds,
              });
              await emit("finding_validated", {
                cached: true,
                findingIds: ids,
                reports: cached.report.reports,
              });
              await completeInteractionRun(input.admin, input.runId, {
                status: "completed",
                latencyMs: 0,
              });
              await emit("run_completed", { cached: true });
              controller.close();
              return;
            }
          }

          const investigatorGraph: PrivacySafeGraph = input.pair
            ? {
                asOf: input.graph.asOf,
                jurisdiction: "GB",
                ageBand: "unknown",
                factors: [
                  {
                    ref: "factor-a",
                    type: "prescribed_medication",
                    name: input.pair.factorA,
                    normalizedName: normalizeFactorName(input.pair.factorA),
                    canonicalName: normalizeFactorName(input.pair.factorA),
                    therapeuticClass: null,
                    identityState: "exact_knowledge_match",
                    dmdCode: null,
                    startsOn: null,
                    endsOn: null,
                    context: {},
                    regimen: null,
                  },
                  {
                    ref: "factor-b",
                    type: "prescribed_medication",
                    name: input.pair.factorB,
                    normalizedName: normalizeFactorName(input.pair.factorB),
                    canonicalName: normalizeFactorName(input.pair.factorB),
                    therapeuticClass: null,
                    identityState: "exact_knowledge_match",
                    dmdCode: null,
                    startsOn: null,
                    endsOn: null,
                    context: {},
                    regimen: null,
                  },
                ],
                relationships: [],
              }
            : input.graph;
          const result = await runInteractionInvestigator(
            {
              mode: input.mode,
              graph: investigatorGraph,
              deterministicFindings: input.deterministicFindings,
              safetyIdentifier: createHash("sha256")
                .update(`signalrx-interactions:${input.userId}`)
                .digest("hex"),
              pair: input.pair,
            },
            emit,
            input.request.signal,
          );
          await emit("validation_started", {
            sourceCount: result.consultedSources.length,
          });
          if (result.failures.length) {
            await completeInteractionRun(input.admin, input.runId, {
              status: "failed",
              validationFailures: result.failures,
              failureCode: "publication_gate_failed",
              inputTokens: result.usage.inputTokens,
              outputTokens: result.usage.outputTokens,
              latencyMs: result.latencyMs,
            });
            await emit("run_failed", {
              code: "publication_gate_failed",
              message:
                "A possible concern was found, but its explanation did not meet the evidence standard.",
            });
            controller.close();
            return;
          }

          const findingIds = await persistInvestigationOutput(input.admin, {
            userId: input.userId,
            runId: input.runId,
            output: result.output,
            baseFindingIds: input.baseFindingIds,
          });
          if (input.pair) {
            await cachePairReport(input.admin, {
              left: input.pair.factorA,
              right: input.pair.factorB,
              jurisdiction: input.jurisdiction,
              output: result.output,
              sourceUrls: result.consultedSources.map((source) => source.url),
            });
          }
          for (const report of result.output.reports) {
            if (report.evidenceState === "conflicting") {
              await emit("evidence_conflict_found", {
                factors: report.factors.map((factor) => factor.name),
              });
            }
          }
          await emit("finding_validated", {
            cached: false,
            findingIds,
            reports: result.output.reports,
          });
          await completeInteractionRun(input.admin, input.runId, {
            status: "completed",
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            latencyMs: result.latencyMs,
          });
          await emit("run_completed", {
            reportCount: result.output.reports.length,
            sourceCount: result.consultedSources.length,
          });
          controller.close();
        } catch (error) {
          const interrupted = input.request.signal.aborted;
          const code = interrupted
            ? "client_disconnected"
            : error instanceof Error
              ? error.message.slice(0, 100)
              : "investigation_failed";
          try {
            await completeInteractionRun(input.admin, input.runId, {
              status: interrupted ? "interrupted" : "failed",
              failureCode: code,
            });
            if (!interrupted) {
              await emit("run_failed", {
                code,
                message:
                  code === "openai_not_configured"
                    ? "The evidence investigator is not configured."
                    : "The evidence investigation could not be completed.",
              });
            }
          } finally {
            controller.close();
          }
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
