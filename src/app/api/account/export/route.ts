import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

const tables = [
  "health_profiles", "source_artifacts", "intake_jobs", "extraction_runs",
  "candidate_facts", "health_items", "health_relationships", "fact_provenance",
  "medication_regimens", "schedule_segments", "dose_events", "calendar_events",
  "prescription_reconciliations", "inventory_lots", "inventory_adjustments",
  "reminder_rules", "reminder_deliveries", "yellow_card_drafts", "health_audit_events",
];

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to export your record.", 401);
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Export is not configured.", 503);
  const record: Record<string, unknown> = {
    format: "SignalRx personal record export",
    version: 1,
    exportedAt: new Date().toISOString(),
    email: auth.email,
  };
  for (const table of tables) {
    const { data } = await admin.from(table).select("*").eq("user_id", auth.userId);
    record[table] = data ?? [];
  }
  return new NextResponse(JSON.stringify(record, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="signalrx-record.json"',
      "cache-control": "no-store",
    },
  });
}
