import { NextResponse } from "next/server";
import { chronologyLanguage, prohibitedCausality, yellowCardRequestSchema } from "@/lib/health/yellow-card";
import { jsonError, requireJson, sameOrigin } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to prepare a Yellow Card draft.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  if (!requireJson(request)) return jsonError("Send JSON.", 415);
  const parsed = yellowCardRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Confirm that you suspect a medicine and choose the relevant items.", 400);
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Yellow Card drafting is not configured.", 503);
  const [{ data: symptom }, { data: medicines }, { data: profile }] = await Promise.all([
    admin.from("health_items").select("*").eq("user_id", auth.userId).eq("id", parsed.data.symptomItemId).eq("item_type", "symptom").maybeSingle(),
    admin.from("health_items").select("*").eq("user_id", auth.userId).in("id", parsed.data.suspectedMedicineIds).in("item_type", ["prescribed_medication", "otc_medication"]).neq("status", "archived"),
    admin.from("health_profiles").select("preferred_name, date_of_birth, sex").eq("user_id", auth.userId).single(),
  ]);
  if (!symptom || !profile || medicines?.length !== parsed.data.suspectedMedicineIds.length) {
    return jsonError("One or more selected record details were not found.", 404);
  }
  const chronology = medicines.map((medicine) => chronologyLanguage({
    symptom: symptom.display_name,
    medicine: medicine.display_name,
    symptomStarted: symptom.starts_on,
    medicineStarted: medicine.starts_on,
  }));
  if (chronology.some((line) => prohibitedCausality.test(line))) return jsonError("The draft failed its non-causality safety check.", 500);
  const draft = {
    suspectedReaction: { name: symptom.display_name, startedOn: symptom.starts_on, details: symptom.details },
    suspectedProducts: medicines.map((medicine) => ({
      name: medicine.display_name,
      dmdCode: medicine.dmd_code,
      dose: medicine.details?.dose ?? null,
      route: medicine.details?.route ?? null,
      startedOn: medicine.starts_on,
      endedOn: medicine.ends_on,
    })),
    patient: { preferredName: profile.preferred_name, dateOfBirth: profile.date_of_birth, sex: profile.sex },
    chronology,
    notes: parsed.data.notes ?? null,
    causalityStatement: "Timing does not prove cause. This draft records your suspicion and chronology only.",
    nextStep: "Review and edit this draft, contact an appropriate clinician, then open the official MHRA Yellow Card service if you choose to report.",
  };
  const { data, error } = await admin.from("yellow_card_drafts").insert({
    user_id: auth.userId,
    symptom_item_id: symptom.id,
    suspected_medicine_ids: parsed.data.suspectedMedicineIds,
    user_suspects_medicine: true,
    draft,
  }).select("id, draft, created_at").single();
  if (error) return jsonError("The draft could not be saved.", 500);
  return NextResponse.json(data, { status: 201 });
}
