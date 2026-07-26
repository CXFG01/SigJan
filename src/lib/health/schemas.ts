import { z } from "zod";

export const healthItemTypes = [
  "prescribed_medication",
  "otc_medication",
  "supplement",
  "herb",
  "condition",
  "symptom",
  "laboratory_marker",
  "lifestyle_factor",
  "appointment",
  "healthcare_contact",
] as const;

export const healthItemTypeSchema = z.enum(healthItemTypes);

export const candidateFactSchema = z.object({
  itemType: healthItemTypeSchema,
  originalWording: z.string().min(1).max(500),
  normalizedWording: z.string().min(1).max(500),
  details: z.record(z.string(), z.unknown()).default({}),
  sourceExcerpt: z.string().max(2000).nullable().default(null),
  sourceLocator: z.string().max(200).nullable().default(null),
  confidence: z.number().min(0).max(1),
  uncertainty: z.string().max(500).nullable().default(null),
});

export const extractionResultSchema = z.object({
  summary: z.string().max(1000),
  candidates: z.array(candidateFactSchema).max(100),
  warnings: z.array(z.string().max(500)).max(20).default([]),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export const intakeCreateSchema = z
  .object({
    mode: z.enum(["text", "document", "photo", "voice_note", "realtime_voice"]),
    text: z.string().max(100_000).optional(),
    artifacts: z
      .array(
        z.object({
          id: z.string().uuid(),
          storagePath: z.string().min(1).max(1000),
          fileName: z.string().min(1).max(255),
          mimeType: z.string().min(1).max(200),
          sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
          sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
        }),
      )
      .max(20)
      .default([]),
  })
  .superRefine((value, context) => {
    const total = value.artifacts.reduce((sum, file) => sum + file.sizeBytes, 0);
    if (total > 50 * 1024 * 1024) {
      context.addIssue({
        code: "custom",
        message: "A single intake can contain at most 50 MB.",
        path: ["artifacts"],
      });
    }
    if (
      !value.text?.trim() &&
      value.artifacts.length === 0 &&
      value.mode !== "realtime_voice"
    ) {
      context.addIssue({
        code: "custom",
        message: "Add text, a recording, or at least one file.",
      });
    }
  });

export const confirmationSchema = z.object({
  decisions: z
    .array(
      z.object({
        candidateId: z.string().uuid(),
        action: z.enum(["confirm", "correct", "reject"]),
        corrected: candidateFactSchema.partial().optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const onboardingSchema = z
  .object({
    preferredName: z.string().trim().min(1).max(80),
    familyName: z.string().trim().max(100).optional(),
    dateOfBirth: z.string().date(),
    ukResident: z.literal(true),
    adultConfirmed: z.literal(true),
    timezone: z.string().min(1).max(100),
    privacyAccepted: z.literal(true),
    healthDataConsent: z.literal(true),
    sex: z.string().max(80).optional(),
    weightKg: z.coerce.number().positive().max(500).optional(),
    accessibilityNeeds: z.string().max(2000).optional(),
    emergencyContact: z.string().max(2000).optional(),
    freeformAbout: z.string().max(10_000).optional(),
  })
  .superRefine((value, context) => {
    const birthday = new Date(`${value.dateOfBirth}T00:00:00Z`);
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
    if (birthday > cutoff) {
      context.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "SignalRx is currently for adults aged 18 or over.",
      });
    }
  });
