import {
  getOrCreateSupabaseSession,
} from "@/lib/supabase/client";

import {
  ExplanationRequestSchema,
  ExtractionRequestSchema,
  ExtractionResponseSchema,
  GeneratedExplanationSchema,
  type ExplanationRequest,
  type ExtractionRequest,
  type ExtractionResponse,
  type GeneratedExplanation,
} from "./schemas";
import {
  DeterministicSignalRxProvider,
  type SignalRxTextProvider,
} from "./provider";

export class RemoteSignalRxProvider implements SignalRxTextProvider {
  constructor(
    private readonly fallback: SignalRxTextProvider =
      new DeterministicSignalRxProvider(),
  ) {}

  async extract(rawRequest: ExtractionRequest): Promise<ExtractionResponse> {
    const request = ExtractionRequestSchema.parse(rawRequest);
    try {
      const result = await this.request("/api/signalrx/extract", request);
      return ExtractionResponseSchema.parse(result);
    } catch {
      const result = await this.fallback.extract(request);
      return ExtractionResponseSchema.parse({
        ...result,
        metadata: { ...result.metadata, usedFallback: true },
      });
    }
  }

  async explain(
    rawRequest: ExplanationRequest,
  ): Promise<GeneratedExplanation> {
    const request = ExplanationRequestSchema.parse(rawRequest);
    try {
      const result = await this.request("/api/signalrx/explain", request);
      return GeneratedExplanationSchema.parse(result);
    } catch {
      const result = await this.fallback.explain(request);
      return GeneratedExplanationSchema.parse({
        ...result,
        metadata: { ...result.metadata, usedFallback: true },
      });
    }
  }

  private async request(path: string, input: unknown): Promise<unknown> {
    const session = await getOrCreateSupabaseSession();
    if (!session) {
      throw new Error("No authenticated Supabase session");
    }

    const response = await fetch(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error(`SignalRx provider request failed (${response.status})`);
    }
    return response.json();
  }
}

export function createBrowserSignalRxProvider(): SignalRxTextProvider {
  return new RemoteSignalRxProvider();
}

