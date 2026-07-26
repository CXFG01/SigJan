import { NextResponse } from "next/server";
import { estimateRunOut, subtractWorkingDays } from "@/lib/health/schedules";
import { jsonError } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return jsonError("Unauthorized.", 401);
  }
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Reminder processing is not configured.", 503);
  const { data: rules, error } = await admin
    .from("reminder_rules")
    .select("id, user_id, channels, lead_working_days, regimen_id, medication_regimens!inner(id, quantity, starts_on, health_items!inner(display_name, details))")
    .eq("kind", "repeat_prescription")
    .eq("enabled", true);
  if (error) return jsonError("Reminder rules could not be read.", 500);
  let scheduled = 0;
  let sent = 0;
  for (const rule of rules ?? []) {
    const regimen = rule.medication_regimens as unknown as {
      quantity: number | null;
      starts_on: string | null;
      health_items: { display_name: string; details: Record<string, unknown> };
    };
    const dailyDose = Number(regimen.health_items.details?.daily_dose);
    const estimate = estimateRunOut({
      quantity: regimen.quantity == null ? null : Number(regimen.quantity),
      dailyDose: Number.isFinite(dailyDose) && dailyDose > 0 ? dailyDose : null,
      startsOn: regimen.starts_on,
    });
    if (estimate.kind !== "exact" || !estimate.date) continue;
    const remindOn = subtractWorkingDays(estimate.date, rule.lead_working_days ?? 5);
    if (remindOn > new Date().toISOString().slice(0, 10)) continue;
    for (const channel of rule.channels as ("in_app" | "email")[]) {
      const idempotencyKey = `${rule.id}:${channel}:${estimate.date}`;
      const { data: delivery, error: insertError } = await admin
        .from("reminder_deliveries")
        .upsert({
          user_id: rule.user_id,
          reminder_rule_id: rule.id,
          channel,
          scheduled_for: `${remindOn}T09:00:00Z`,
          idempotency_key: idempotencyKey,
        }, { onConflict: "idempotency_key", ignoreDuplicates: true })
        .select("id, status")
        .maybeSingle();
      if (insertError || !delivery) continue;
      scheduled += 1;
      if (channel === "in_app") {
        await admin.from("reminder_deliveries").update({ status: "sent", delivered_at: new Date().toISOString() }).eq("id", delivery.id);
        sent += 1;
      } else if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
        const { data: userData } = await admin.auth.admin.getUserById(rule.user_id);
        if (!userData.user?.email) continue;
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL,
            to: [userData.user.email],
            subject: `Your ${regimen.health_items.display_name} may run out soon`,
            text: `SignalRx estimates that ${regimen.health_items.display_name} may run out on ${estimate.date}, based on ${estimate.explanation} Check the assumptions in SignalRx and use the official NHS App or NHS website to request a repeat if appropriate. SignalRx cannot order or check prescription status.`,
          }),
        });
        await admin.from("reminder_deliveries").update(response.ok
          ? { status: "sent", delivered_at: new Date().toISOString() }
          : { status: "failed", failure_code: `resend_${response.status}` }
        ).eq("id", delivery.id);
        if (response.ok) sent += 1;
      }
    }
  }
  return NextResponse.json({ scheduled, sent });
}
