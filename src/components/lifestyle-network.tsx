"use client";

import { useState } from "react";
import Link from "next/link";
import { List, Orbit } from "lucide-react";
import { itemTypeLabels, type HealthItemType } from "@/lib/health/labels";

type Item = { id: string; display_name: string; item_type: HealthItemType; dmd_match_state: string };
type Relationship = {
  id: string;
  from_item_id: string;
  to_item_id: string;
  relationship_type: string;
  certainty: string;
};

const positions = [
  [18, 24], [68, 18], [82, 52], [60, 78], [24, 76], [10, 50], [45, 10], [90, 32],
];

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
  const coordinates = new Map(items.map((item, index) => [item.id, positions[index % positions.length]]));

  return (
    <div className="network-workspace">
      <div className="view-switch" role="group" aria-label="Network view">
        <button aria-pressed={view === "graph"} onClick={() => setView("graph")}><Orbit size={18} /> Graph</button>
        <button aria-pressed={view === "list"} onClick={() => setView("list")}><List size={18} /> Accessible list</button>
      </div>

      {view === "graph" ? (
        <div className="network-canvas" aria-label={`Lifestyle Network for ${name}`}>
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
            {items.map((item) => {
              const point = coordinates.get(item.id)!;
              return <line key={`person-${item.id}`} x1="50" y1="48" x2={point[0]} y2={point[1]} />;
            })}
            {relationships.map((relationship) => {
              const from = coordinates.get(relationship.from_item_id);
              const to = coordinates.get(relationship.to_item_id);
              return from && to ? (
                <line className="relationship-line" key={relationship.id} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
              ) : null;
            })}
          </svg>
          <div className="graph-person"><strong>{name}</strong><span>Your confirmed record</span></div>
          {items.map((item, index) => {
            const point = positions[index % positions.length];
            return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className={`graph-node type-${item.item_type}`}
                style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
              >
                <strong>{item.display_name}</strong>
                <span>{itemTypeLabels[item.item_type]}</span>
              </Link>
            );
          })}
          {!items.length ? (
            <div className="graph-empty">
              <p>Your network grows only from facts you confirm.</p>
              <Link className="button button-primary" href="/add">Add your first item</Link>
            </div>
          ) : null}
        </div>
      ) : (
        <NetworkList items={items} relationships={relationships} />
      )}
      <p className="network-legend">
        Lines show source membership, your reported purpose, documented relationships,
        measurements, or timing overlap. They never claim interaction or cause.
      </p>
    </div>
  );
}

function NetworkList({ items, relationships }: { items: Item[]; relationships: Relationship[] }) {
  if (!items.length) {
    return <div className="teaching-empty"><h3>Your network is ready to grow</h3><p>Add information, then confirm the facts you want to keep.</p></div>;
  }
  return (
    <ul className="network-list">
      {items.map((item) => {
        const related = relationships.filter((edge) => edge.from_item_id === item.id || edge.to_item_id === item.id);
        return (
          <li key={item.id}>
            <div><p className="eyebrow">{itemTypeLabels[item.item_type]}</p><Link href={`/items/${item.id}`}><h2>{item.display_name}</h2></Link></div>
            <p>{related.length ? `${related.length} confirmed ${related.length === 1 ? "relationship" : "relationships"}` : "No confirmed relationships"}</p>
            <ul>
              {related.map((edge) => <li key={edge.id}>{edge.relationship_type.replaceAll("_", " ")} · {edge.certainty.replaceAll("_", " ")}</li>)}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
