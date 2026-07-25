"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ManualMedicationValues } from "@/components/intake/manual-medication-form";
import {
  deleteDemoSessionState,
  loadDemoSessionState,
  saveDemoSessionState,
} from "@/lib/supabase/demo-session";
import {
  appendReviewAction,
  applyClinicalRules,
  applyReviewActionToConcern,
  applyReviewActionToPatientPlan,
  confirmMedicationEntry,
  correctMedicationFields,
  correctMedicationIdentity,
  createAuditEvent,
  createNextReviewAction,
  createReviewActionAuditEvent,
  DEMO_CAREGIVER_ACTOR,
  DEMO_EPISODE,
  DEMO_OBSERVATIONS,
  DEMO_PATIENT_ACTOR,
  DEMO_PHARMACIST_ACTOR,
  DEMO_REVIEWED_EPISODE,
  DEMO_SYSTEM_ACTOR,
  EpisodeStateSchema,
  normalizeMedicationName,
  publishPatientPlan,
  recordCaregiverMedicationStatus,
  reopenEpisodeAfterMedicationMutation,
  transitionEpisode,
  type EpisodeState,
  type MedicationFieldCorrections,
  type ReviewDisposition,
} from "@/domain";
import {
  extractDemoIntakeSource,
  createBrowserSignalRxProvider,
  type DemoIntakeExtraction,
  type DemoIntakeSourceId,
} from "@/providers";

export type DemoRole = "patient" | "caregiver" | "professional";

export type ReviewDispositionInput = {
  concernId: string;
  disposition: ReviewDisposition;
  reason: string;
  owner: string;
  dueDate: string;
  followUpAction: string;
  patientFacingMessage: string;
};

type PersistedDemoState = {
  role: DemoRole;
  intakeSources: string[];
  manualMedications: ManualMedicationValues[];
  episode: EpisodeState;
};

type DemoContextValue = PersistedDemoState & {
  hydrated: boolean;
  setRole: (role: DemoRole) => void;
  importSource: (
    sourceId: DemoIntakeSourceId,
    contentOverride?: string,
  ) => Promise<void>;
  importAllDemoSources: () => Promise<void>;
  addManualMedication: (values: ManualMedicationValues) => void;
  correctMedication: (
    medicationId: string,
    corrections: MedicationFieldCorrections,
  ) => { ok: true } | { ok: false; error: string };
  confirmMedication: (medicationId: string) => void;
  confirmAllMedications: () => void;
  recordCaregiverStatus: (
    medicationId: string,
    status: "taken" | "not_taken" | "unknown",
    administeredBy: string,
    note: string,
  ) => void;
  openProfessionalReview: () => void;
  recordReviewDisposition: (
    input: ReviewDispositionInput,
  ) => { ok: true } | { ok: false; error: string };
  applySeededProfessionalReview: () => void;
  publishReviewedPlan: () => { ok: true } | { ok: false; error: string };
  resetDemo: () => void;
};

const STORAGE_KEY = "signalrx-demo-v3";
const SEEDED_INTAKE_SOURCES: readonly DemoIntakeSourceId[] = [
  "discharge_document",
  "medicine_box",
  "voice_note",
];

function cloneSeedEpisode(
  episode: EpisodeState = DEMO_EPISODE,
): EpisodeState {
  return structuredClone(episode);
}

function createInitialEpisode(): EpisodeState {
  const episode = cloneSeedEpisode();
  return EpisodeStateSchema.parse({
    ...episode,
    medicationSources: [],
    medicationEntries: [],
    observations: [],
    symptoms: [],
    concerns: [],
    timelineEvents: [],
    reviewActions: [],
    auditEvents: [],
    patientPlan: {
      ...episode.patientPlan,
      status: "draft",
      verifiedMedicationEntryIds: [],
      awaitingConfirmationEntryIds: [],
      reviewItems: [],
      contactOwner: null,
      followUpDate: null,
      questionsToAsk: [],
      approvedBy: null,
      approvedAt: null,
    },
  });
}

function createInitialState(): PersistedDemoState {
  return {
    role: "patient",
    intakeSources: [],
    manualMedications: [],
    episode: createInitialEpisode(),
  };
}

const DemoContext = createContext<DemoContextValue | null>(null);

function parsePersistedState(value: unknown): PersistedDemoState {
  const fallback = createInitialState();
  try {
    if (!value) {
      return fallback;
    }
    const parsed =
      typeof value === "string"
        ? (JSON.parse(value) as Partial<PersistedDemoState>)
        : (value as Partial<PersistedDemoState>);
    const episode = EpisodeStateSchema.safeParse(parsed.episode);
    return {
      role:
        parsed.role === "caregiver" || parsed.role === "professional"
          ? parsed.role
          : "patient",
      intakeSources: Array.isArray(parsed.intakeSources)
        ? parsed.intakeSources.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
      manualMedications: Array.isArray(parsed.manualMedications)
        ? parsed.manualMedications
        : [],
      episode: episode.success ? episode.data : fallback.episode,
    };
  } catch {
    return fallback;
  }
}

function readStoredState(): PersistedDemoState {
  return parsePersistedState(window.localStorage.getItem(STORAGE_KEY));
}

function withPlanVerification(
  episode: EpisodeState,
  medicationEntries: EpisodeState["medicationEntries"],
): EpisodeState {
  const verifiedMedicationEntryIds = medicationEntries
    .filter((entry) =>
      ["confirmed", "corrected"].includes(entry.confirmationStatus),
    )
    .map((entry) => entry.id);
  const awaitingConfirmationEntryIds = medicationEntries
    .filter(
      (entry) =>
        !["confirmed", "corrected"].includes(entry.confirmationStatus),
    )
    .map((entry) => entry.id);

  return EpisodeStateSchema.parse({
    ...episode,
    medicationEntries,
    patientPlan: {
      ...episode.patientPlan,
      verifiedMedicationEntryIds,
      awaitingConfirmationEntryIds,
    },
  });
}

function appendUniqueById<T extends { id: string }>(
  existing: readonly T[],
  incoming: readonly T[],
): T[] {
  const items = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    if (!items.has(item.id)) {
      items.set(item.id, item);
    }
  }
  return [...items.values()];
}

function mergeMedicationEntries(
  existing: readonly EpisodeState["medicationEntries"][number][],
  incoming: readonly EpisodeState["medicationEntries"][number][],
): EpisodeState["medicationEntries"] {
  const entries = new Map(existing.map((entry) => [entry.id, entry]));
  for (const candidate of incoming) {
    const current = entries.get(candidate.id);
    if (!current) {
      entries.set(candidate.id, candidate);
      continue;
    }
    const additionalSourceIds = [
      ...new Set([
        ...current.additionalSourceIds,
        ...candidate.additionalSourceIds,
        candidate.sourceId,
      ]),
    ].filter((sourceId) => sourceId !== current.sourceId);
    entries.set(
      candidate.id,
      EpisodeStateSchema.shape.medicationEntries.element.parse({
        ...current,
        additionalSourceIds,
      }),
    );
  }
  return [...entries.values()];
}

function refreshClinicalState(
  episode: EpisodeState,
  occurredAt: string,
): EpisodeState {
  const concerns = applyClinicalRules({
    episodeId: episode.id,
    entries: episode.medicationEntries,
    conditions: episode.patient.conditions,
    observations: episode.observations,
    rules: episode.clinicalRules,
    evidenceRecords: episode.evidenceRecords,
    asOf: occurredAt,
  });
  const existingAuditIds = new Set(
    episode.auditEvents.map((event) => event.id),
  );
  const concernAuditEvents = concerns.flatMap((concern) => {
    const id = concern.auditEventIds[0];
    if (existingAuditIds.has(id)) {
      return [];
    }
    return [
      createAuditEvent({
        id,
        episodeId: episode.id,
        action: "concern_created",
        entityType: "concern",
        entityId: concern.id,
        actor: DEMO_SYSTEM_ACTOR,
        occurredAt,
        details: {
          evidenceIds: concern.evidenceIds.join(","),
          ruleId: concern.ruleId,
          ruleVersion: concern.ruleVersion,
        },
      }),
    ];
  });

  return EpisodeStateSchema.parse({
    ...episode,
    asOf: occurredAt,
    concerns,
    auditEvents: [...episode.auditEvents, ...concernAuditEvents],
    patientPlan: {
      ...episode.patientPlan,
      questionsToAsk: concerns.map((concern) => concern.suggestedQuestion),
      lastUpdatedAt: occurredAt,
    },
  });
}

function mergeDemoIntakeExtraction(
  episode: EpisodeState,
  extraction: DemoIntakeExtraction,
  occurredAt: string,
): EpisodeState {
  const existingSourceIds = new Set(
    episode.medicationSources.map((source) => source.id),
  );
  const newSources = extraction.sources.filter(
    (source) => !existingSourceIds.has(source.id),
  );
  const sourceAuditEvents = newSources.map((source) =>
    createAuditEvent({
      id: `audit-source-imported-${source.id.replace(/^source-/u, "")}`,
      episodeId: episode.id,
      action: "source_imported",
      entityType: "source",
      entityId: source.id,
      actor: DEMO_PATIENT_ACTOR,
      occurredAt,
      details: {
        sourceType: source.type,
        synthetic: "true",
      },
    }),
  );
  const extractionAuditEvents = extraction.entries.flatMap((entry) => {
    const id = `audit-extraction-created-${entry.id.replace(/^med-/u, "")}-${entry.sourceId.replace(/^source-/u, "")}`;
    return episode.auditEvents.some((event) => event.id === id)
      ? []
      : [
          createAuditEvent({
            id,
            episodeId: episode.id,
            action: "extraction_created",
            entityType: "medication_entry",
            entityId: entry.id,
            actor: DEMO_SYSTEM_ACTOR,
            occurredAt,
            details: {
              confirmationStatus: entry.confirmationStatus,
              sourceId: entry.sourceId,
            },
          }),
        ];
  });
  const medicationEntries = mergeMedicationEntries(
    episode.medicationEntries,
    extraction.entries,
  );
  const observations =
    extraction.ledgerSourceId === "discharge_document"
      ? appendUniqueById(episode.observations, DEMO_OBSERVATIONS)
      : episode.observations;
  const updated = withPlanVerification(
    EpisodeStateSchema.parse({
      ...episode,
      medicationSources: appendUniqueById(
        episode.medicationSources,
        extraction.sources,
      ),
      medicationEntries,
      observations,
      symptoms: appendUniqueById(episode.symptoms, extraction.symptoms),
      timelineEvents: appendUniqueById(
        episode.timelineEvents,
        extraction.timelineEvents,
      ),
      auditEvents: [
        ...episode.auditEvents,
        ...sourceAuditEvents,
        ...extractionAuditEvents,
      ],
    }),
    medicationEntries,
  );
  const refreshed = refreshClinicalState(updated, occurredAt);
  return reopenEpisodeAfterMedicationMutation(
    refreshed,
    DEMO_PATIENT_ACTOR,
    occurredAt,
  );
}

function advanceToReadyWhenPossible(
  episode: EpisodeState,
  occurredAt: string,
): EpisodeState {
  const hasBlockingConfirmation = episode.medicationEntries.some((entry) =>
    ["needs_confirmation", "uncertain_match"].includes(
      entry.confirmationStatus,
    ),
  );
  if (
    episode.workflowState === "awaiting_confirmation" &&
    !hasBlockingConfirmation
  ) {
    return transitionEpisode(
      episode,
      "ready_for_review",
      DEMO_PATIENT_ACTOR,
      occurredAt,
    ).episode;
  }
  return episode;
}

function confirmPendingEntries(
  episode: EpisodeState,
  occurredAt: string,
): EpisodeState {
  const auditEvents = [...episode.auditEvents];
  let confirmedAny = false;
  const medicationEntries = episode.medicationEntries.map((entry) => {
    if (
      !["needs_confirmation", "uncertain_match"].includes(
        entry.confirmationStatus,
      )
    ) {
      return entry;
    }
    const confirmed = confirmMedicationEntry(
      entry,
      DEMO_PATIENT_ACTOR,
      occurredAt,
    );
    confirmedAny = true;
    auditEvents.push(
      createAuditEvent({
        episodeId: episode.id,
        action: "medication_confirmed",
        entityType: "medication_entry",
        entityId: entry.id,
        actor: DEMO_PATIENT_ACTOR,
        occurredAt,
        existingEvents: auditEvents,
        details: { previousStatus: entry.confirmationStatus },
      }),
    );
    return confirmed;
  });
  const updated = withPlanVerification(
    { ...episode, auditEvents },
    medicationEntries,
  );
  const reopened = confirmedAny
    ? reopenEpisodeAfterMedicationMutation(
        updated,
        DEMO_PATIENT_ACTOR,
        occurredAt,
      )
    : updated;
  return advanceToReadyWhenPossible(reopened, occurredAt);
}

function advanceToProfessionalReview(
  episode: EpisodeState,
  occurredAt: string,
): EpisodeState {
  if (episode.workflowState === "ready_for_review") {
    return transitionEpisode(
      episode,
      "in_review",
      DEMO_PHARMACIST_ACTOR,
      occurredAt,
    ).episode;
  }
  return episode;
}

function normaliseManualCategory(
  category: ManualMedicationValues["category"],
): EpisodeState["medicationEntries"][number]["category"] {
  if (category === "diet") {
    return "food_drink";
  }
  return category;
}

function applyMedicationCorrectionsToEpisode(
  episode: EpisodeState,
  medicationId: string,
  corrections: MedicationFieldCorrections,
  occurredAt: string,
): EpisodeState {
  const original = episode.medicationEntries.find(
    (entry) => entry.id === medicationId,
  );
  if (!original) {
    throw new Error("The medication entry could not be found.");
  }

  const enteredName = corrections.enteredName;
  const fieldCorrections = { ...corrections };
  delete fieldCorrections.enteredName;
  delete fieldCorrections.normalizedName;
  let corrected = original;
  if (typeof enteredName === "string") {
    corrected = correctMedicationIdentity(
      corrected,
      enteredName,
      DEMO_PATIENT_ACTOR,
      occurredAt,
    );
  }
  if (Object.keys(fieldCorrections).length > 0) {
    corrected = correctMedicationFields(
      corrected,
      fieldCorrections,
      DEMO_PATIENT_ACTOR,
      occurredAt,
    );
  }

  const medicationEntries = episode.medicationEntries.map((entry) =>
    entry.id === medicationId ? corrected : entry,
  );
  const correctedFields = Object.keys(corrections)
    .filter((field) => field !== "normalizedName")
    .sort()
    .join(",");
  const audit = createAuditEvent({
    episodeId: episode.id,
    action: "medication_corrected",
    entityType: "medication_entry",
    entityId: medicationId,
    actor: DEMO_PATIENT_ACTOR,
    occurredAt,
    existingEvents: episode.auditEvents,
    details: {
      fields: correctedFields,
      identityRemapped: String(typeof enteredName === "string"),
    },
  });
  const updated = refreshClinicalState(
    withPlanVerification(
      {
        ...episode,
        auditEvents: [...episode.auditEvents, audit],
      },
      medicationEntries,
    ),
    occurredAt,
  );
  const reopened = reopenEpisodeAfterMedicationMutation(
    updated,
    DEMO_PATIENT_ACTOR,
    occurredAt,
  );
  return advanceToReadyWhenPossible(reopened, occurredAt);
}

function applyReviewDispositionToEpisode(
  rawEpisode: EpisodeState,
  input: ReviewDispositionInput,
  occurredAt: string,
): EpisodeState {
  const episode = advanceToProfessionalReview(rawEpisode, occurredAt);
  if (episode.workflowState !== "in_review") {
    throw new Error(
      "Patient confirmation must be completed before recording a live professional disposition.",
    );
  }
  const concern = episode.concerns.find(
    (item) => item.id === input.concernId,
  );
  if (!concern) {
    throw new Error("The selected concern could not be found.");
  }

  const action = createNextReviewAction(episode.reviewActions, {
    episodeId: episode.id,
    concernId: concern.id,
    disposition: input.disposition,
    reason: input.reason.trim() || null,
    owner: input.owner.trim() || null,
    dueDate: input.dueDate || null,
    followUpAction: input.followUpAction.trim() || null,
    patientFacingMessage: input.patientFacingMessage.trim() || null,
    reviewerId: DEMO_PHARMACIST_ACTOR.id,
    reviewerName: DEMO_PHARMACIST_ACTOR.name,
    reviewedAt: occurredAt,
  });
  const updatedConcern = applyReviewActionToConcern(concern, action);
  const patientPlan = applyReviewActionToPatientPlan(
    episode.patientPlan,
    concern,
    action,
  );
  const audit = createReviewActionAuditEvent(
    action,
    DEMO_PHARMACIST_ACTOR,
    episode.auditEvents,
  );

  return EpisodeStateSchema.parse({
    ...episode,
    concerns: episode.concerns.map((item) =>
      item.id === concern.id ? updatedConcern : item,
    ),
    reviewActions: appendReviewAction(episode.reviewActions, action),
    patientPlan,
    auditEvents: [...episode.auditEvents, audit],
  });
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedDemoState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const textProvider = useMemo(() => createBrowserSignalRxProvider(), []);

  useEffect(() => {
    let active = true;
    const localState = readStoredState();

    void loadDemoSessionState()
      .then((remoteState) => {
        if (!active) {
          return;
        }
        setState(
          remoteState === null
            ? localState
            : parsePersistedState(remoteState),
        );
      })
      .catch(() => {
        if (active) {
          setState(localState);
        }
      })
      .finally(() => {
        if (active) {
          setHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const remoteSaveTimer = window.setTimeout(() => {
      void saveDemoSessionState(state).catch(() => {
        // Local storage remains the resilient offline fallback.
      });
    }, 500);
    return () => window.clearTimeout(remoteSaveTimer);
  }, [hydrated, state]);

  const setRole = useCallback((role: DemoRole) => {
    setState((current) => {
      if (
        role === "patient" ||
        current.episode.medicationEntries.length > 0
      ) {
        return { ...current, role };
      }
      return {
        ...current,
        role,
        intakeSources: [...SEEDED_INTAKE_SOURCES],
        episode: cloneSeedEpisode(),
      };
    });
  }, []);

  const importSource = useCallback(
    async (
      sourceId: DemoIntakeSourceId,
      contentOverride?: string,
    ): Promise<void> => {
      const extraction = await extractDemoIntakeSource(
        sourceId,
        contentOverride,
        textProvider,
      );
      const occurredAt = new Date().toISOString();
      setState((current) => {
        if (current.intakeSources.includes(sourceId)) {
          return current;
        }
        return {
          ...current,
          intakeSources: [...current.intakeSources, sourceId],
          episode: mergeDemoIntakeExtraction(
            current.episode,
            extraction,
            occurredAt,
          ),
        };
      });
    },
    [textProvider],
  );

  const importAllDemoSources = useCallback(async (): Promise<void> => {
    const extractions = await Promise.all(
      SEEDED_INTAKE_SOURCES.map((sourceId) =>
        extractDemoIntakeSource(sourceId, undefined, textProvider),
      ),
    );
    const occurredAt = new Date().toISOString();
    setState((current) => {
      const episode = extractions.reduce(
        (candidate, extraction) =>
          current.intakeSources.includes(extraction.ledgerSourceId)
            ? candidate
            : mergeDemoIntakeExtraction(
                candidate,
                extraction,
                occurredAt,
              ),
        current.episode,
      );
      return {
        ...current,
        intakeSources: [...SEEDED_INTAKE_SOURCES],
        episode,
      };
    });
  }, [textProvider]);

  const addManualMedication = useCallback(
    (values: ManualMedicationValues) => {
      setState((current) => {
        const sequence = current.manualMedications.length + 1;
        const occurredAt = new Date().toISOString();
        const sourceId = `source-manual-entry-${sequence}`;
        const medicationId = `med-manual-entry-${sequence}`;
        const strengthNumber = Number(values.strength);
        const strength =
          values.strength &&
          Number.isFinite(strengthNumber) &&
          strengthNumber > 0
            ? strengthNumber
            : null;
        const normalization = normalizeMedicationName(values.enteredName);
        const source = {
          id: sourceId,
          episodeId: current.episode.id,
          type: "manual_entry" as const,
          label: `Manual entry: ${values.enteredName}`,
          originalExcerpt: `${values.enteredName}; ${values.strength || "strength unknown"} ${values.unit}; ${values.frequency}`,
          capturedAt: occurredAt,
          suppliedBy: DEMO_PATIENT_ACTOR.name,
          synthetic: true as const,
        };
        const entry = {
          id: medicationId,
          episodeId: current.episode.id,
          patientId: current.episode.patient.id,
          enteredName: values.enteredName,
          originalName: values.enteredName,
          normalizedName: normalization.normalizedName,
          conceptId: normalization.conceptId,
          ingredient: normalization.ingredient,
          ingredientIds: normalization.ingredientId
            ? [normalization.ingredientId]
            : [],
          normalizationStatus: normalization.status,
          strength,
          unit: values.unit || null,
          dose: values.dose || null,
          frequency: values.frequency.replaceAll("_", " "),
          route: values.route as
            | "oral"
            | "topical"
            | "inhaled"
            | "injection"
            | "other"
            | "unknown",
          formulation: values.formulation as
            | "tablet"
            | "modified_release_tablet"
            | "capsule"
            | "liquid"
            | "cream"
            | "injection"
            | "unknown",
          category: normaliseManualCategory(values.category),
          startDate: null,
          startDatePrecision: "unknown" as const,
          stopDate: null,
          stopDatePrecision: "unknown" as const,
          currentStatus: "unknown" as const,
          sourceId,
          sourceLabel: source.label,
          sourceExcerpt: source.originalExcerpt,
          additionalSourceIds: [],
          reportedBy: DEMO_PATIENT_ACTOR.name,
          reportedByRole: "patient" as const,
          administeredBy: DEMO_PATIENT_ACTOR.name,
          confirmationStatus: "needs_confirmation" as const,
          confidence: normalization.confidence,
          administrationStatus: "not_recorded" as const,
          notes: values.notes,
          provenance: [
            {
              id: `provenance-manual-entry-${sequence}-name`,
              field: "enteredName" as const,
              originalValue: values.enteredName,
              normalizedValue:
                normalization.normalizedName ?? values.enteredName,
              sourceId,
              confidence: normalization.confidence,
              confirmationStatus: "needs_confirmation" as const,
              editorId: DEMO_PATIENT_ACTOR.id,
              editorRole: DEMO_PATIENT_ACTOR.role,
              recordedAt: occurredAt,
              supersedesProvenanceId: null,
            },
          ],
          createdAt: occurredAt,
          updatedAt: occurredAt,
        };
        const sourceAudit = createAuditEvent({
          episodeId: current.episode.id,
          action: "source_imported",
          entityType: "source",
          entityId: sourceId,
          actor: DEMO_PATIENT_ACTOR,
          occurredAt,
          existingEvents: current.episode.auditEvents,
          details: { sourceType: "manual_entry", synthetic: "true" },
        });
        const medicationEntries = [
          ...current.episode.medicationEntries,
          entry,
        ];
        const updated = refreshClinicalState(
          withPlanVerification(
            EpisodeStateSchema.parse({
              ...current.episode,
              medicationSources: [
                ...current.episode.medicationSources,
                source,
              ],
              medicationEntries,
              auditEvents: [...current.episode.auditEvents, sourceAudit],
            }),
            medicationEntries,
          ),
          occurredAt,
        );
        const episode = reopenEpisodeAfterMedicationMutation(
          updated,
          DEMO_PATIENT_ACTOR,
          occurredAt,
        );
        return {
          ...current,
          manualMedications: [...current.manualMedications, values],
          episode,
        };
      });
    },
    [],
  );

  const correctMedication = useCallback(
    (
      medicationId: string,
      corrections: MedicationFieldCorrections,
    ): { ok: true } | { ok: false; error: string } => {
      try {
        const occurredAt = new Date().toISOString();
        const episodeAtCall = state.episode;
        const preview = applyMedicationCorrectionsToEpisode(
          episodeAtCall,
          medicationId,
          corrections,
          occurredAt,
        );
        setState((current) => ({
          ...current,
          episode:
            current.episode === episodeAtCall
              ? preview
              : applyMedicationCorrectionsToEpisode(
                  current.episode,
                  medicationId,
                  corrections,
                  occurredAt,
                ),
        }));
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "The corrections could not be saved.",
        };
      }
    },
    [state.episode],
  );

  const confirmMedication = useCallback((medicationId: string) => {
    setState((current) => {
      const original = current.episode.medicationEntries.find(
        (entry) => entry.id === medicationId,
      );
      if (
        !original ||
        ["confirmed", "corrected"].includes(original.confirmationStatus)
      ) {
        return current;
      }
      const occurredAt = new Date().toISOString();
      const medicationEntries = current.episode.medicationEntries.map(
        (entry) =>
          entry.id === medicationId
            ? confirmMedicationEntry(
                entry,
                DEMO_PATIENT_ACTOR,
                occurredAt,
              )
            : entry,
      );
      const audit = createAuditEvent({
        episodeId: current.episode.id,
        action: "medication_confirmed",
        entityType: "medication_entry",
        entityId: medicationId,
        actor: DEMO_PATIENT_ACTOR,
        occurredAt,
        existingEvents: current.episode.auditEvents,
        details: { previousStatus: original.confirmationStatus },
      });
      const updated = withPlanVerification(
        {
          ...current.episode,
          auditEvents: [...current.episode.auditEvents, audit],
        },
        medicationEntries,
      );
      const reopened = reopenEpisodeAfterMedicationMutation(
        updated,
        DEMO_PATIENT_ACTOR,
        occurredAt,
      );
      return {
        ...current,
        episode: advanceToReadyWhenPossible(reopened, occurredAt),
      };
    });
  }, []);

  const confirmAllMedications = useCallback(() => {
    setState((current) => ({
      ...current,
      episode: confirmPendingEntries(
        current.episode,
        new Date().toISOString(),
      ),
    }));
  }, []);

  const recordCaregiverStatus = useCallback(
    (
      medicationId: string,
      status: "taken" | "not_taken" | "unknown",
      administeredBy: string,
      note: string,
    ) => {
      setState((current) => {
        const occurredAt = new Date().toISOString();
        let auditEvent: EpisodeState["auditEvents"][number] | null = null;
        const medicationEntries = current.episode.medicationEntries.map(
          (entry) => {
            if (entry.id !== medicationId) {
              return entry;
            }
            const result = recordCaregiverMedicationStatus(
              entry,
              status,
              administeredBy,
              note,
              DEMO_CAREGIVER_ACTOR,
              occurredAt,
              current.episode.auditEvents,
            );
            auditEvent = result.auditEvent;
            return result.entry;
          },
        );
        if (!auditEvent) {
          return current;
        }
        return {
          ...current,
          episode: EpisodeStateSchema.parse({
            ...current.episode,
            medicationEntries,
            auditEvents: [...current.episode.auditEvents, auditEvent],
          }),
        };
      });
    },
    [],
  );

  const openProfessionalReview = useCallback(() => {
    setState((current) =>
      current.episode.medicationEntries.length > 0
        ? { ...current, role: "professional" }
        : {
            ...current,
            role: "professional",
            intakeSources: [...SEEDED_INTAKE_SOURCES],
            episode: cloneSeedEpisode(),
          },
    );
  }, []);

  const recordReviewDisposition = useCallback(
    (
      input: ReviewDispositionInput,
    ): { ok: true } | { ok: false; error: string } => {
      try {
        const occurredAt = new Date().toISOString();
        const episodeAtCall = state.episode;
        const preview = applyReviewDispositionToEpisode(
          episodeAtCall,
          input,
          occurredAt,
        );
        setState((current) => ({
          ...current,
          episode:
            current.episode === episodeAtCall
              ? preview
              : applyReviewDispositionToEpisode(
                  current.episode,
                  input,
                  occurredAt,
                ),
        }));
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "The disposition could not be recorded.",
        };
      }
    },
    [state.episode],
  );

  const applySeededProfessionalReview = useCallback(() => {
    setState((current) => ({
      ...current,
      role: "professional",
      intakeSources: [...SEEDED_INTAKE_SOURCES],
      manualMedications: [],
      episode: cloneSeedEpisode(DEMO_REVIEWED_EPISODE),
    }));
  }, []);

  const publishReviewedPlan = useCallback(
    (): { ok: true } | { ok: false; error: string } => {
      try {
        if (state.episode.patientPlan.status === "approved") {
          return { ok: true };
        }
        const occurredAt = new Date().toISOString();
        let episode = advanceToProfessionalReview(
          state.episode,
          occurredAt,
        );
        if (episode.workflowState !== "in_review") {
          throw new Error(
            "The episode must be ready for professional review before publication.",
          );
        }
        const published = publishPatientPlan(
          episode.patientPlan,
          episode.concerns.map((concern) => concern.id),
          DEMO_PHARMACIST_ACTOR,
          occurredAt,
          episode.auditEvents,
        );
        episode = EpisodeStateSchema.parse({
          ...episode,
          patientPlan: published.plan,
          auditEvents: [...episode.auditEvents, published.auditEvent],
        });
        if (episode.workflowState === "in_review") {
          episode = transitionEpisode(
            episode,
            published.workflowOutcome,
            DEMO_PHARMACIST_ACTOR,
            occurredAt,
          ).episode;
        }
        setState((current) => ({ ...current, episode }));
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "The patient plan could not be published.",
        };
      }
    },
    [state.episode],
  );

  const resetDemo = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    void deleteDemoSessionState().catch(() => {
      // A local reset still succeeds if remote persistence is unavailable.
    });
    setState(createInitialState());
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      ...state,
      hydrated,
      setRole,
      importSource,
      importAllDemoSources,
      addManualMedication,
      correctMedication,
      confirmMedication,
      confirmAllMedications,
      recordCaregiverStatus,
      openProfessionalReview,
      recordReviewDisposition,
      applySeededProfessionalReview,
      publishReviewedPlan,
      resetDemo,
    }),
    [
      state,
      hydrated,
      setRole,
      importSource,
      importAllDemoSources,
      addManualMedication,
      correctMedication,
      confirmMedication,
      confirmAllMedications,
      recordCaregiverStatus,
      openProfessionalReview,
      recordReviewDisposition,
      applySeededProfessionalReview,
      publishReviewedPlan,
      resetDemo,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return context;
}
