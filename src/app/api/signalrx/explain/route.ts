import { NextResponse } from "next/server";

import {
  ExplanationRequestSchema,
  createSignalRxProvider,
} from "@/providers";
import { guardSignalRxRequest } from "@/server/api-guard";
import { OpenAIJsonGenerator } from "@/server/openai-generator";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const guardResponse = await guardSignalRxRequest(request);
  if (guardResponse) {
    return guardResponse;
  }

  try {
    const input = ExplanationRequestSchema.parse(await request.json());
    const provider = createSignalRxProvider(new OpenAIJsonGenerator());
    const result = await provider.explain(input);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Explanation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

