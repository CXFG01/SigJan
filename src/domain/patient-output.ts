import { z } from "zod";

import {
  ConcernSchema,
  EpisodeStateSchema,
  MedicationEntrySchema,
  PatientPlanSchema,
  TimelineEventSchema,
  type EpisodeState,
} from "./schemas";

export const PatientResultSchema = z
  .object({
    episodeId: z.string().min(1),
    medicationEntries: z.array(MedicationEntrySchema),
    concerns: z.array(ConcernSchema).max(3),
    timelineEvents: z.array(TimelineEventSchema),
    patientPlan: PatientPlanSchema,
    synthetic: z.literal(true),
    demoLabel: z.literal("Synthetic demonstration data"),
  })
  .strict();
export type PatientResult = z.infer<typeof PatientResultSchema>;

export const ResearchHypothesisSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    evidenceBoundary: z.literal(
      "Research hypothesis only. This output does not establish a clinical interaction and does not affect the patient’s medication plan.",
    ),
  })
  .strict();
export type ResearchHypothesis = z.infer<typeof ResearchHypothesisSchema>;

export function buildPatientResult(rawEpisode: EpisodeState): PatientResult {
  const episode = EpisodeStateSchema.parse(rawEpisode);
  return PatientResultSchema.parse({
    episodeId: episode.id,
    medicationEntries: episode.medicationEntries,
    concerns: episode.concerns,
    timelineEvents: episode.timelineEvents,
    patientPlan: episode.patientPlan,
    synthetic: true,
    demoLabel: "Synthetic demonstration data",
  });
}
