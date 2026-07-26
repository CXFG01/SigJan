const CURATED_ALIASES: Record<string, string> = {
  advil: "ibuprofen",
  eliquis: "apixaban",
  flagyl: "metronidazole",
  nurofen: "ibuprofen",
  zocor: "simvastatin",
  grapefruit: "grapefruit juice",
};

export function normalizeFactorName(value: string) {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[®™]/g, "")
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|micrograms?|milligrams?)\b/g, " ")
    .replace(/\b(tablets?|capsules?|oral|solution|modified release|mr)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return CURATED_ALIASES[normalized] ?? normalized;
}

export function orderedPair(left: string, right: string) {
  const pair = [normalizeFactorName(left), normalizeFactorName(right)].sort();
  return [pair[0], pair[1]] as const;
}

export function interactionPairKey(left: string, right: string) {
  return orderedPair(left, right).join("::");
}

export type RxNormCandidate = {
  rxcui: string;
  name: string;
  score: number;
};

export async function suggestRxNormCandidates(
  name: string,
  signal?: AbortSignal,
): Promise<RxNormCandidate[]> {
  const url = new URL("https://rxnav.nlm.nih.gov/REST/approximateTerm.json");
  url.searchParams.set("term", name);
  url.searchParams.set("maxEntries", "3");
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    approximateGroup?: {
      candidate?: Array<{
        rxcui?: string;
        name?: string;
        score?: string;
      }>;
    };
  };
  return (payload.approximateGroup?.candidate ?? [])
    .filter((entry) => entry.rxcui && entry.name)
    .map((entry) => ({
      rxcui: entry.rxcui!,
      name: entry.name!,
      score: Number(entry.score ?? 0),
    }));
}

