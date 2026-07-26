import { z } from "zod";

export const emergencyContactInputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const emergencyContactSchema = z.object({
  name: z.string().trim().max(120).nullable(),
  relationship: z.string().trim().max(120).nullable(),
  phoneNumber: z.string().trim().max(80).nullable(),
  notes: z.string().trim().max(300).nullable(),
});

export const emergencyContactsSchema = z.object({
  contacts: z.array(emergencyContactSchema).max(20),
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
