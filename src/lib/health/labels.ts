import { healthItemTypes } from "./schemas";

export type HealthItemType = (typeof healthItemTypes)[number];

export const itemTypeLabels: Record<HealthItemType, string> = {
  prescribed_medication: "Prescription medicine",
  otc_medication: "Over-the-counter medicine",
  supplement: "Supplement",
  herb: "Herb",
  condition: "Condition",
  symptom: "Symptom",
  laboratory_marker: "Laboratory marker",
  lifestyle_factor: "Lifestyle",
  appointment: "Appointment",
  healthcare_contact: "Healthcare contact",
};
