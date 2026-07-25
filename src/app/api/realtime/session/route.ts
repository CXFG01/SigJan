import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { jsonError, sameOrigin } from "@/lib/http";
import { authenticateRequest } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to start guided voice.", 401);
  if (!sameOrigin(request)) return jsonError("This request did not come from SignalRx.", 403);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2.1";
  if (!apiKey) return jsonError("Guided voice is not configured.", 503);
  const safetyId = createHash("sha256").update(auth.userId).digest("hex").slice(0, 64);
  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": safetyId,
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model,
        instructions:
          "You are SignalRx's calm intake guide for UK adults. Ask one short question at a time about medicines, supplements, conditions, symptoms, tests, appointments, routines, and lifestyle. Reflect the user's wording. Never diagnose, infer cause, recommend dose changes, or claim a medicine interaction. Explain that every extracted fact will require their review. If severe or rapidly worsening symptoms are mentioned, give only static guidance to contact NHS 111 or 999 in an emergency.",
        audio: {
          input: { transcription: { model: "gpt-4o-mini-transcribe" } },
          output: { voice: "marin" },
        },
      },
    }),
  });
  if (!response.ok) return jsonError("Guided voice could not start. Use a voice note or text instead.", 502);
  const data = await response.json();
  return NextResponse.json({
    client_secret: data.value,
    expires_at: data.expires_at,
    model,
  });
}
