"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const manualMedicationSchema = z
  .object({
    enteredName: z.string().trim().min(2, "Enter the product name."),
    strength: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (Number.isFinite(Number(value)) && Number(value) > 0),
        "Strength must be a positive number or left unknown.",
      ),
    unit: z.string().trim(),
    dose: z.string().trim(),
    frequency: z.string().trim().min(1, "Choose how often it is taken."),
    route: z.string().trim().min(1, "Choose a route."),
    formulation: z.string().trim(),
    category: z.enum(["prescription", "otc", "supplement", "diet"]),
    notes: z.string().trim().max(500, "Keep notes under 500 characters."),
  })
  .strict();

export type ManualMedicationValues = z.infer<typeof manualMedicationSchema>;

type ManualMedicationFormProps = {
  onAdd: (values: ManualMedicationValues) => void;
};

export function ManualMedicationForm({ onAdd }: ManualMedicationFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManualMedicationValues>({
    resolver: zodResolver(manualMedicationSchema),
    defaultValues: {
      enteredName: "",
      strength: "",
      unit: "mg",
      dose: "",
      frequency: "once_daily",
      route: "oral",
      formulation: "tablet",
      category: "prescription",
      notes: "",
    },
  });

  const submit = handleSubmit((values) => {
    onAdd(values);
    reset();
  });

  return (
    <form className="manual-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="manual-product-name">Product name</label>
        <input
          aria-describedby={
            errors.enteredName ? "manual-product-name-error" : undefined
          }
          aria-invalid={Boolean(errors.enteredName)}
          className="input"
          id="manual-product-name"
          placeholder="As written on the box or label"
          {...register("enteredName")}
        />
        {errors.enteredName && (
          <span className="form-error" id="manual-product-name-error">
            {errors.enteredName.message}
          </span>
        )}
      </div>

      <div className="field-row-strength">
        <div className="field">
          <label htmlFor="manual-strength">Strength</label>
          <input
            aria-describedby={
              errors.strength ? "manual-strength-error" : undefined
            }
            aria-invalid={Boolean(errors.strength)}
            className="input"
            id="manual-strength"
            inputMode="decimal"
            placeholder="e.g. 5"
            {...register("strength")}
          />
          {errors.strength && (
            <span className="form-error" id="manual-strength-error">
              {errors.strength.message}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="manual-unit">Unit</label>
          <select className="select" id="manual-unit" {...register("unit")}>
            <option value="mg">mg</option>
            <option value="microgram">microgram</option>
            <option value="ml">ml</option>
            <option value="unknown">I don’t know</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="manual-dose">Dose taken</label>
          <input
            className="input"
            id="manual-dose"
            placeholder="e.g. 1 tablet"
            {...register("dose")}
          />
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="manual-frequency">How often</label>
          <select
            aria-describedby={
              errors.frequency ? "manual-frequency-error" : undefined
            }
            aria-invalid={Boolean(errors.frequency)}
            className="select"
            id="manual-frequency"
            {...register("frequency")}
          >
            <option value="once_daily">Once daily</option>
            <option value="twice_daily">Twice daily</option>
            <option value="as_needed">When needed</option>
            <option value="unknown">I don’t know</option>
          </select>
          {errors.frequency && (
            <span className="form-error" id="manual-frequency-error">
              {errors.frequency.message}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="manual-category">Type</label>
          <select
            className="select"
            id="manual-category"
            {...register("category")}
          >
            <option value="prescription">Prescription</option>
            <option value="otc">Over-the-counter</option>
            <option value="supplement">Vitamin or supplement</option>
            <option value="diet">Food or drink exposure</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="manual-route">Route</label>
          <select className="select" id="manual-route" {...register("route")}>
            <option value="oral">By mouth</option>
            <option value="topical">On the skin</option>
            <option value="inhaled">Inhaled</option>
            <option value="other">Other</option>
            <option value="unknown">I don’t know</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="manual-formulation">Formulation</label>
          <select
            className="select"
            id="manual-formulation"
            {...register("formulation")}
          >
            <option value="tablet">Tablet</option>
            <option value="modified_release_tablet">
              Modified-release tablet
            </option>
            <option value="capsule">Capsule</option>
            <option value="liquid">Liquid</option>
            <option value="unknown">I don’t know</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="manual-notes">Notes</label>
        <textarea
          className="textarea"
          id="manual-notes"
          placeholder="Anything the pharmacist should know"
          {...register("notes")}
        />
        {errors.notes && (
          <span className="form-error">{errors.notes.message}</span>
        )}
      </div>

      <div>
        <button
          className="button button-secondary"
          disabled={isSubmitting}
          type="submit"
        >
          <Plus aria-hidden="true" size={17} />
          Add to confirmation list
        </button>
      </div>
    </form>
  );
}
