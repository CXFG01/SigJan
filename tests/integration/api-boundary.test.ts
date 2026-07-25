import { describe, expect, it } from "vitest";

import { POST as extract } from "@/app/api/signalrx/extract/route";
import { ExtractionRequestSchema } from "@/providers";

describe("server-only provider boundary", () => {
  it("requires an authenticated Supabase session before extraction", async () => {
    const response = await extract(
      new Request("http://localhost/api/signalrx/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: "request-api-boundary",
          sourceId: "source-api-boundary",
          sourceType: "patient_statement",
          content: "Apixaban 5 mg twice daily.",
          requestedAt: "2026-07-25T12:00:00Z",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "A valid SignalRx session is required.",
    });
  });

  it("rejects oversized requests before authentication or model use", async () => {
    const response = await extract(
      new Request("http://localhost/api/signalrx/extract", {
        method: "POST",
        headers: {
          "Content-Length": "32001",
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(413);
  });

  it("caps extraction content before it can become model input", () => {
    expect(
      ExtractionRequestSchema.safeParse({
        requestId: "request-content-limit",
        sourceId: "source-content-limit",
        sourceType: "patient_statement",
        content: "a".repeat(12_001),
        requestedAt: "2026-07-25T12:00:00Z",
      }).success,
    ).toBe(false);
  });
});
