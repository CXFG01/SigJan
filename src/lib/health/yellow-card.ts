import { z } from "zod";

export const yellowCardRequestSchema = z.object({
  symptomItemId: z.string().uuid(),
  suspectedMedicineIds: z.array(z.string().uuid()).min(1).max(20),
  userSuspectsMedicine: z.literal(true),
  notes: z.string().max(5000).optional(),
});

export function chronologyLanguage(input: {
  symptom: string;
  medicine: string;
  symptomStarted?: string | null;
  medicineStarted?: string | null;
}) {
  if (input.symptomStarted && input.medicineStarted) {
    const relation =
      input.symptomStarted >= input.medicineStarted
        ? "occurred after"
        : "was reported during overlapping exposure to";
    return `${input.symptom} ${relation} ${input.medicine}. Timing does not prove cause.`;
  }
  return `${input.symptom} was reported during possible exposure to ${input.medicine}. Timing does not prove cause.`;
}

export const prohibitedCausality =
  /\b(caused by|definitely caused|proves? that|responsible for)\b/i;
