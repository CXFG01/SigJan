import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMedicine } from "@/lib/checker/identity";
import { ddinterAdapter } from "@/lib/checker/sources";
function dbFor(known: string[], identities: Record<string,string[]> = {}) {
  return { from(table: string) {
    let name = "";
    const query = { select: () => query, eq: (key: string, value: string) => { if (["normalized_name","factor_a_normalized","factor_b_normalized"].includes(key)) name = value; return query; }, limit: async () => ({ data: table === "medicine_identity_cache" ? (identities[name] ?? []).map(ingredient_normalized => ({ ingredient_normalized })) : known.includes(name) ? [{ id: "known" }] : [], error: null }) };
    return query;
  } } as unknown as SupabaseClient;
}
const medicine = (name: string) => ({ name, dose: "", route: "", frequency: "" });
describe("confirmed ingredient identity", () => {
  it("matches brand aliases without changing supplied regimen details", async () => {
    const result = await resolveMedicine(dbFor(["ibuprofen"]), { ...medicine("Nurofen"), dose: "200 mg", frequency: "as needed" });
    expect(result).toMatchObject({ ingredients: ["ibuprofen"], dose: "200 mg", frequency: "as needed", route: "" });
  });
  it("expands co-codamol and explicit combination ingredients", async () => {
    const db = dbFor(["acetaminophen","codeine"]);
    expect((await resolveMedicine(db, medicine("Co-codamol")))?.ingredients).toEqual(["acetaminophen","codeine"]);
    expect((await resolveMedicine(db, medicine("Paracetamol + codeine")))?.ingredients).toEqual(["acetaminophen","codeine"]);
  });
  it("rejects ambiguous or partially unknown compositions", async () => {
    expect(await resolveMedicine(dbFor([], { brand: ["a","b"] }), medicine("brand"))).toBeNull();
    expect(await resolveMedicine(dbFor(["acetaminophen"]), medicine("Co-codamol"))).toBeNull();
    expect(await resolveMedicine(dbFor([]), medicine("Unclear medicine"))).toBeNull();
  });
  it("reports an empty active database separately from a negative pair lookup", async () => {
    const db = { from: () => { const q = { select: () => q, eq: () => q, then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve) }; return q; } } as unknown as SupabaseClient;
    const result = await ddinterAdapter(db).check(["a","b"]);
    expect(result.coverage[0].status).toBe("unavailable"); expect(result.findings).toHaveLength(0);
  });
});
