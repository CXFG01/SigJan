import { NextResponse } from "next/server";

import {
  ExtractionRequestSchema,
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
    const input = ExtractionRequestSchema.parse(await request.json());
    const provider = createSignalRxProvider(new OpenAIJsonGenerator());
    const result = await provider.extract(input);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

