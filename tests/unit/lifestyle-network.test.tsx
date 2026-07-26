import { describe, expect, it } from "vitest";
import {
  buildVisGraph,
  networkPhysics,
} from "@/components/lifestyle-network";
import type { NetworkItem } from "@/lib/interactions/network-relationships";

const items: NetworkItem[] = [
  ["m1", "Tiotropium", "prescribed_medication"],
  ["m2", "Betahistine", "prescribed_medication"],
  ["m3", "Insulin", "prescribed_medication"],
  ["m4", "Aspirin", "otc_medication"],
  ["c1", "Diabetes", "condition"],
  ["c2", "Neuropathy", "condition"],
  ["c3", "Chronic pain", "condition"],
  ["s1", "Dizziness", "symptom"],
  ["s2", "Falls", "symptom"],
  ["s3", "Poor vision", "symptom"],
  ["l1", "Poor adherence", "lifestyle_factor"],
].map(([id, display_name, item_type]) => ({
  id,
  display_name,
  item_type: item_type as NetworkItem["item_type"],
  dmd_match_state: "unmatched",
}));

describe("Lifestyle Network graph data", () => {
  it("connects every item to the central confirmed record", () => {
    const graph = buildVisGraph("Arthur", items, []);
    const itemNodes = graph.nodes.filter((node) =>
      items.some((item) => item.id === node.id),
    );
    const membershipEdges = graph.edges.filter((edge) =>
      String(edge.id).startsWith("membership:"),
    );

    expect(itemNodes).toHaveLength(items.length);
    expect(itemNodes.every((node) => node.physics)).toBe(true);
    expect(membershipEdges).toHaveLength(items.length);
    expect(membershipEdges.every((edge) => edge.from === "person")).toBe(true);
  });

  it("keeps the centre anchored while applying strong overlap repulsion", () => {
    const graph = buildVisGraph("Arthur", items, []);
    const person = graph.nodes.find((node) => node.id === "person");

    expect(person).toMatchObject({
      fixed: true,
      physics: true,
      mass: 6,
    });
    expect(networkPhysics.forceAtlas2Based).toMatchObject({
      gravitationalConstant: -72,
      springLength: 225,
      avoidOverlap: 1,
    });
    expect(networkPhysics.stabilization.iterations).toBe(700);
  });

  it("creates a visible DDInter relationship edge", () => {
    const graph = buildVisGraph("Arthur", items, [
      {
        id: "ddi-1",
        from_item_id: "m1",
        to_item_id: "m2",
        relationship_type: "documented medicine interaction",
        certainty: "DDInter source match",
        source: "ddinter",
        severity: "Moderate",
      },
    ]);
    const edge = graph.edges.find((candidate) => candidate.id === "ddi-1");

    expect(edge).toMatchObject({
      from: "m1",
      to: "m2",
      width: 2,
      dashes: false,
    });
  });
});
