import { describe, expect, it } from "vitest";
import { graphContainsDirectIdentifiers, type PrivacySafeGraph } from "@/lib/interactions/graph";
import {
  extractSourcesFromProviderEvent,
  parseInvestigationOutput,
} from "@/lib/interactions/investigator";
import { classifyInvestigationFailure } from "@/lib/interactions/streaming";

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

  it("classifies provider failures without storing raw error text", () => {
    expect(
      classifyInvestigationFailure(
        new Error("400 Invalid schema for response_format 'output'"),
      ),
    ).toBe("investigation_schema_rejected");
    expect(classifyInvestigationFailure(new Error("429 rate limit exceeded"))).toBe(
      "investigator_rate_limited",
    );
    expect(classifyInvestigationFailure(new Error("provider exploded"))).toBe(
      "investigation_failed",
    );
  });

  it("parses a JSON investigation before the publication policy runs", () => {
    const output = {
      reports: [
        {
          findingType: "documented_concern",
          factors: [
            { name: "Apixaban", canonicalName: "apixaban" },
            { name: "Ibuprofen", canonicalName: "ibuprofen" },
          ],
          triggerType: "ddinter",
          sourceSeverity: "major",
          evidenceState: "established",
          evidenceStrength: "high",
          whatThisIsAbout: { text: "A documented interaction.", sourceRefs: ["nhs-1"] },
          potentialConsequence: { text: "Bleeding risk may increase.", sourceRefs: ["nhs-1"] },
          mechanism: { text: "Both can affect bleeding.", sourceRefs: ["nhs-1"] },
          riskModifiers: [],
          missingInformation: [],
          warningSigns: [],
          nextStep: "contact_pharmacist",
          nextStepExplanation: { text: "Ask a pharmacist to review this.", sourceRefs: ["nhs-1"] },
          pharmacistQuestion: "Can you review these medicines together?",
          limitations: ["This is general information."],
          sources: [
            {
              ref: "nhs-1",
              url: "https://www.nhs.uk/medicines/apixaban/",
              title: "Apixaban",
              organization: "NHS",
              jurisdiction: "GB",
              publicationOrUpdateDate: null,
              documentSection: null,
            },
          ],
        },
      ],
      overallLimitations: ["This does not replace clinical advice."],
    };

    expect(parseInvestigationOutput(JSON.stringify(output))).toEqual(output);
    expect(parseInvestigationOutput(`\`\`\`json\n${JSON.stringify(output)}\n\`\`\``)).toEqual(
      output,
    );
  });

  it("rejects non-JSON or incomplete investigation output safely", () => {
    expect(() => parseInvestigationOutput("I could not complete this.")).toThrow(
      "investigation_output_invalid",
    );
    expect(() => parseInvestigationOutput('{"reports":[]}')).toThrow(
      "investigation_output_invalid",
    );
    expect(
      classifyInvestigationFailure(new Error("investigation_output_invalid")),
    ).toBe("investigation_output_invalid");
  });
});
