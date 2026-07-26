import { describe, expect, it } from "vitest";
import { graphContainsDirectIdentifiers, type PrivacySafeGraph } from "@/lib/interactions/graph";
import { extractSourcesFromProviderEvent } from "@/lib/interactions/investigator";

const graph: PrivacySafeGraph = {
  asOf: "2026-07-26T12:00:00.000Z",
  jurisdiction: "GB",
  ageBand: "40-54",
  factors: [
    {
      ref: "factor-1",
      type: "prescribed_medication",
      name: "Apixaban",
      normalizedName: "apixaban",
      canonicalName: "apixaban",
      therapeuticClass: "anticoagulant",
      identityState: "exact_knowledge_match",
      dmdCode: null,
      startsOn: null,
      endsOn: null,
      context: {},
      regimen: { strength: "5 mg", route: "oral", startsOn: null, endsOn: null },
    },
  ],
  relationships: [],
};

describe("privacy-safe streaming helpers", () => {
  it("keeps direct identifiers out of graph payloads", () => {
    expect(graphContainsDirectIdentifiers(graph)).toBe(false);
    expect(
      graphContainsDirectIdentifiers({
        ...graph,
        factors: [{ ...graph.factors[0], name: "user_id 2572b952-8875-4a71-a0ca-ec61bd950f65" }],
      }),
    ).toBe(true);
  });

  it("extracts only allowlisted sources from provider events", () => {
    const sources = extractSourcesFromProviderEvent({
      action: {
        sources: [
          { url: "https://www.nhs.uk/medicines/apixaban/", title: "NHS apixaban" },
          { url: "https://random-blog.example/post", title: "Blog" },
        ],
      },
    });
    expect(sources).toEqual([
      {
        url: "https://www.nhs.uk/medicines/apixaban/",
        title: "NHS apixaban",
      },
    ]);
  });
});
