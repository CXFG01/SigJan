import { describe, expect, it, vi } from "vitest";
import { buildPairs, checkSchema, type ResolvedMedicine, type SourceFinding } from "@/lib/checker/types";
import { checkSources } from "@/lib/checker/sources";
import { bearer, hash, runToken } from "@/lib/checker/store";
import { body } from "@/lib/checker/http";

const med = (name: string, ingredients = [name]): ResolvedMedicine => ({ name, ingredients, dose: "", route: "", frequency: "", identitySource: "fixture" });
const finding = (a: string, b: string, severity: string, id = "1"): SourceFinding => ({ id, ingredients: [a,b], severity, source: "fixture", version: "1", url: "https://example.org" });
describe("prescription pair assessment", () => {
  it("checks all 45 pairs of ten medicines and queues at most three", () => {
    const pairs = buildPairs(Array.from({ length: 10 }, (_, i) => med(String(i))), { findings: [], coverage: [] });
    expect(pairs).toHaveLength(45);
    expect(pairs.filter(p => p.research === "queued")).toHaveLength(3);
    expect(pairs.filter(p => p.research === "skipped")).toHaveLength(42);
  });
  it("preserves conflicting records and prioritises them over uncovered pairs", () => {
    const records = [finding("c","d","minor"),finding("c","d","major","2")];
    const pairs = buildPairs([med("a"),med("b"),med("c"),med("d")], { findings: records, coverage: [] });
    expect(pairs.at(-1)).toMatchObject({ reason: "conflicting", research: "queued", findings: records });
  });
  it("does not mistake different ingredient interactions for source disagreement", () => {
    const pair = buildPairs([med("combination",["a","b"]),med("c")], { findings: [finding("a","c","minor"),finding("b","c","major","2")], coverage: [] })[0];
    expect(pair.reason).toBeNull();
    expect(pair.findings).toHaveLength(2);
  });
  it("escalates partial combination coverage, unknown severity and duplicates", () => {
    expect(buildPairs([med("ab",["a","b"]),med("c")], { findings: [finding("a","c","major")], coverage: [] })[0].reason).toBe("uncovered");
    expect(buildPairs([med("a"),med("b")], { findings: [finding("a","b","unknown")], coverage: [] })[0].reason).toBe("incomplete");
    expect(buildPairs([med("a"),med("brand",["a"])], { findings: [], coverage: [] })[0].duplicateIngredients).toEqual(["a"]);
  });
  it("does not discard findings when a second adapter fails", async () => {
    const result = await checkSources([{ key: "good", check: async () => ({ findings: [finding("a","b","minor")], coverage: [] }) }, { key: "bad", check: async () => { throw Error(); } }], ["a","b"]);
    expect(result.findings).toHaveLength(1); expect(result.coverage[0].status).toBe("error");
  });
  it("rejects injected ingredient identities and more than ten medicines", () => {
    expect(checkSchema.safeParse({ medicines: [med("a"),med("b")], idempotencyKey: crypto.randomUUID() }).success).toBe(false);
  });
});
describe("anonymous request boundaries", () => {
  it("binds retry tokens to client and submission without revealing either", () => {
    vi.stubEnv("CHECKER_TOKEN_SECRET", "a-test-secret");
    const a = runToken("one","submission");
    expect(a).toMatch(/^[a-f0-9]{64}$/); expect(a).toBe(runToken("one","submission"));
    expect(a).not.toBe(runToken("two","submission")); expect(hash(a)).not.toBe(a);
    vi.unstubAllEnvs();
  });
  it("accepts tokens only from authorization, never URL parameters", () => {
    expect(bearer(new Request("https://example.org?token=" + "a".repeat(64)))).toBeNull();
    expect(bearer(new Request("https://example.org", { headers: { authorization: "Bearer " + "a".repeat(64) } }))).toBe("a".repeat(64));
  });
  it("rejects cross-origin and oversized requests", async () => {
    await expect(body(new Request("https://example.org", { method: "POST", headers: { origin: "https://evil.org", "content-type": "application/json" }, body: "{}" }))).rejects.toThrow("origin");
    await expect(body(new Request("https://example.org", { method: "POST", headers: { "content-type": "application/json" }, body: "x".repeat(17000) }))).rejects.toThrow("large");
  });
});
