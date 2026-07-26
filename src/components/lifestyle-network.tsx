"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { List, Orbit } from "lucide-react";
import type { Edge as VisEdge, Node as VisNode } from "vis-network";
import { itemTypeLabels, type HealthItemType } from "@/lib/health/labels";
import type {
  NetworkItem as Item,
  NetworkRelationship as Relationship,
} from "@/lib/interactions/network-relationships";

type Cluster = "medicines" | "conditions" | "symptoms" | "context";

const clusterForType: Record<HealthItemType, Cluster> = {
  prescribed_medication: "medicines",
  otc_medication: "medicines",
  supplement: "medicines",
  herb: "medicines",
  condition: "conditions",
  symptom: "symptoms",
  laboratory_marker: "conditions",
  lifestyle_factor: "context",
  appointment: "context",
  healthcare_contact: "context",
};

const clusterConfig = {
  medicines: { color: "#f8f6ef", border: "#6f9297" },
  conditions: { color: "#fffdfa", border: "#91adb0" },
  symptoms: { color: "#fde7bd", border: "#b89c69" },
  context: { color: "#c8efeb", border: "#69a8a4" },
} satisfies Record<Cluster, { color: string; border: string }>;

export const networkPhysics = {
  enabled: true,
  solver: "forceAtlas2Based",
  stabilization: {
    enabled: true,
    iterations: 700,
    updateInterval: 30,
    fit: false,
  },
  forceAtlas2Based: {
    gravitationalConstant: -72,
    centralGravity: 0.006,
    springLength: 225,
    springConstant: 0.045,
    damping: 0.56,
    avoidOverlap: 1,
  },
  maxVelocity: 20,
  minVelocity: 0.18,
} as const;

export function buildVisGraph(
  name: string,
  items: Item[],
  relationships: Relationship[],
) {
  const nodes: VisNode[] = [
    {
      id: "person",
      label: `${name}\nYour confirmed record`,
      x: 0,
      y: 0,
      fixed: true,
      physics: true,
      mass: 6,
      shape: "box",
      color: { background: "#102833", border: "#102833" },
      font: {
        color: "#fffdfa",
        face: "Atkinson Hyperlegible Next Variable",
        size: 18,
      },
      margin: { top: 14, right: 18, bottom: 14, left: 18 },
      widthConstraint: { minimum: 150, maximum: 150 },
      borderWidth: 0,
    },
  ];
  const edges: VisEdge[] = [];

  for (const item of items) {
    const cluster = clusterForType[item.item_type];
    const config = clusterConfig[cluster];
    nodes.push({
      id: item.id,
      label: `${item.display_name}\n${itemTypeLabels[item.item_type]}`,
      group: cluster,
      physics: true,
      mass: 1.6,
      shape: "box",
      color: {
        background: config.color,
        border: config.border,
        highlight: { background: config.color, border: "#007c78" },
        hover: { background: config.color, border: "#007c78" },
      },
      font: {
        color: "#102833",
        face: "Atkinson Hyperlegible Next Variable",
        size: 16,
      },
      margin: { top: 13, right: 13, bottom: 13, left: 13 },
      widthConstraint: { minimum: 130, maximum: 190 },
      borderWidth: 1,
      title: `${itemTypeLabels[item.item_type]}. Double-click to open.`,
    });
    edges.push({
      id: `membership:${item.id}`,
      from: "person",
      to: item.id,
      physics: true,
      length: 225,
      width: 0.7,
      color: {
        color: "rgba(111,146,151,.42)",
        highlight: "#6f9297",
        hover: "#6f9297",
      },
      smooth: { enabled: true, type: "continuous", roundness: 0.12 },
    });
  }

  for (const relationship of relationships) {
    edges.push({
      id: relationship.id,
      from: relationship.from_item_id,
      to: relationship.to_item_id,
      physics: true,
      length: relationship.source === "ddinter" ? 270 : 220,
      width:
        relationship.severity === "Major"
          ? 3
          : relationship.severity === "Moderate"
            ? 2
            : 1.4,
      color:
        relationship.source === "ddinter"
          ? { color: "#007c78", highlight: "#005d5a", hover: "#005d5a" }
          : { color: "#8ba4a9", highlight: "#536a73", hover: "#536a73" },
      dashes: relationship.source !== "ddinter",
      smooth: { enabled: true, type: "continuous", roundness: 0.18 },
    });
  }
  return { nodes, edges };
}

export function LifestyleNetwork({
  name,
  items,
  relationships,
}: {
  name: string;
  items: Item[];
  relationships: Relationship[];
}) {
  const [view, setView] = useState<"graph" | "list">("graph");
  const canvasRef = useRef<HTMLDivElement>(null);
  const graph = useMemo(
    () => buildVisGraph(name, items, relationships),
    [items, name, relationships],
  );
  const documentedCount = relationships.filter(
    (relationship) => relationship.source === "ddinter",
  ).length;

  useEffect(() => {
    if (view !== "graph" || !canvasRef.current || !items.length) return;
    let disposed = false;
    let destroy: (() => void) | undefined;

    void import("vis-network/standalone").then(({ DataSet, Network }) => {
      if (disposed || !canvasRef.current) return;
      const network = new Network(
        canvasRef.current,
        {
          nodes: new DataSet(graph.nodes),
          edges: new DataSet(graph.edges),
        },
        {
          autoResize: true,
          interaction: {
            dragNodes: true,
            dragView: true,
            hover: true,
            keyboard: { enabled: true },
            navigationButtons: true,
            tooltipDelay: 200,
            zoomView: true,
          },
          physics: networkPhysics,
          layout: { improvedLayout: true, randomSeed: 42 },
          nodes: {
            chosen: true,
            shadow: { enabled: true, color: "rgba(16,40,51,.09)", size: 16 },
          },
          edges: { selectionWidth: 1.5, hoverWidth: 1.5 },
        },
      );
      const visibleNodeIds = ["person", ...items.map((item) => item.id)];
      const fitVisibleNodes = () => {
        if (!canvasRef.current) return;
        network.redraw();
        network.fit({
          nodes: visibleNodeIds,
          animation: false,
        });
        if (
          canvasRef.current.clientWidth >= 900 &&
          network.getScale() < 0.68
        ) {
          network.moveTo({
            position: network.getViewPosition(),
            scale: 0.68,
            animation: false,
          });
        }
      };
      network.once("stabilizationIterationsDone", () => {
        network.setOptions({ physics: false });
        fitVisibleNodes();
      });
      network.on("doubleClick", ({ nodes }: { nodes: string[] }) => {
        const id = nodes[0];
        if (id && id !== "person") {
          window.location.assign(`/items/${id}`);
        }
      });
      destroy = () => {
        network.destroy();
      };
    });

    return () => {
      disposed = true;
      destroy?.();
    };
  }, [graph, items, view]);

  return (
    <div className="network-workspace">
      <div className="view-switch" role="group" aria-label="Network view">
        <button aria-pressed={view === "graph"} onClick={() => setView("graph")}>
          <Orbit size={18} /> Interactive map
        </button>
        <button aria-pressed={view === "list"} onClick={() => setView("list")}>
          <List size={18} /> Accessible list
        </button>
      </div>

      {view === "graph" ? (
        <div className="network-canvas-shell">
          {items.length ? (
            <>
              <div
                ref={canvasRef}
                className="network-canvas"
                role="application"
                aria-label={`Interactive Lifestyle Network for ${name}. Drag nodes to rearrange, scroll to zoom, or double-click an item to open it.`}
              />
              <p className="network-canvas-hint">
                Drag to arrange · Scroll to zoom · Double-click to open
              </p>
            </>
          ) : (
            <div className="network-canvas graph-empty">
              <p>Your network grows only from facts you confirm.</p>
              <Link className="button button-primary" href="/add">
                Add your first item
              </Link>
            </div>
          )}
        </div>
      ) : (
        <NetworkList items={items} relationships={relationships} />
      )}
      <p className="network-legend">
        <span><i className="legend-line legend-ddinter" /> DDInter documented medicine match</span>
        <span><i className="legend-line legend-record" /> Part of your confirmed record</span>
        {documentedCount
          ? ` ${documentedCount} documented ${documentedCount === 1 ? "match" : "matches"} found.`
          : " No documented DDInter match with an assigned severity was found between the medicines currently in your record."}
      </p>
    </div>
  );
}

function NetworkList({
  items,
  relationships,
}: {
  items: Item[];
  relationships: Relationship[];
}) {
  if (!items.length) {
    return (
      <div className="teaching-empty">
        <h3>Your network is ready to grow</h3>
        <p>Add information, then confirm the facts you want to keep.</p>
      </div>
    );
  }
  return (
    <ul className="network-list">
      {items.map((item) => {
        const related = relationships.filter(
          (edge) => edge.from_item_id === item.id || edge.to_item_id === item.id,
        );
        return (
          <li key={item.id}>
            <div>
              <p className="eyebrow">{itemTypeLabels[item.item_type]}</p>
              <Link href={`/items/${item.id}`}><h2>{item.display_name}</h2></Link>
            </div>
            <p>
              {related.length
                ? `${related.length} ${related.length === 1 ? "relationship" : "relationships"}`
                : "No documented relationships"}
            </p>
            <ul>
              {related.map((edge) => (
                <li key={edge.id}>
                  {edge.relationship_type.replaceAll("_", " ")} · {edge.certainty.replaceAll("_", " ")}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
