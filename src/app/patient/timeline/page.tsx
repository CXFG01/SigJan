"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CircleHelp,
  ClipboardCheck,
  HeartPulse,
  Package,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import type { TimelineEvent } from "@/domain";
import { useDemo } from "@/context/demo-provider";

type TimelineFilter = "all" | "medication" | "symptom" | "review";

const symptomTypes = new Set<TimelineEvent["type"]>([
  "symptom_onset",
  "symptom_resolution",
]);
const reviewTypes = new Set<TimelineEvent["type"]>([
  "professional_review",
  "follow_up_task",
]);

export default function TimelinePage() {
  const { episode } = useDemo();
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const events = useMemo(
    () =>
      episode.timelineEvents.filter((event) => {
        if (filter === "symptom") {
          return symptomTypes.has(event.type);
        }
        if (filter === "review") {
          return reviewTypes.has(event.type);
        }
        if (filter === "medication") {
          return !symptomTypes.has(event.type) && !reviewTypes.has(event.type);
        }
        return true;
      }),
    [episode.timelineEvents, filter],
  );

  return (
    <AppShell
      description="Timing can help a professional ask better questions. Sequence alone does not prove that a medicine caused a symptom."
      eyebrow="Step 5 of 6 · Understand the sequence"
      mode="patient"
      title="What happened, and when"
    >
      <div className="app-stack">
        <section className="timeline-orientation">
          <CalendarClock aria-hidden="true" size={23} />
          <div>
            <h2>Chronology, not causality</h2>
            <p>
              Exact, approximate, and unknown dates remain visibly distinct.
              “Occurred after” and “reported during overlapping exposure”
              describe timing only.
            </p>
          </div>
        </section>

        <div className="timeline-toolbar">
          <span className="field-label">Show timeline events</span>
          <div className="segmented-control">
            {(
              [
                ["all", "All"],
                ["medication", "Medicines"],
                ["symptom", "Symptoms"],
                ["review", "Review"],
              ] as const
            ).map(([value, label]) => (
              <button
                aria-pressed={filter === value}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ol className="medication-timeline">
          {events.map((event) => (
            <TimelineItem event={event} key={event.id} />
          ))}
        </ol>

        <section className="app-equal-columns">
          <div className="utility-panel" data-tone="amber">
            <h2>Two dates remain uncertain</h2>
            <p>
              Recent ibuprofen dose dates and the ginkgo start date were not
              available. Their sequence is labelled “timing requires review.”
            </p>
          </div>
          <div className="utility-panel">
            <h2>Symptoms are patient-reported</h2>
            <p>
              Evelyn reported new bruising and dizziness after discharge. This
              timeline does not diagnose an adverse reaction or assign a cause.
            </p>
          </div>
        </section>

        <div className="app-bottom-actions">
          <Link className="button button-ghost" href="/patient/concerns">
            <ArrowLeft aria-hidden="true" size={17} />
            Back to concerns
          </Link>
          <Link className="button button-primary" href="/patient/plan">
            Open patient plan
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const Icon = symptomTypes.has(event.type)
    ? HeartPulse
    : reviewTypes.has(event.type)
      ? ClipboardCheck
      : event.datePrecision === "unknown"
        ? CircleHelp
        : Package;
  const eventKind = symptomTypes.has(event.type)
    ? "symptom"
    : reviewTypes.has(event.type)
      ? "review"
      : "medication";

  return (
    <li className="timeline-item" data-kind={eventKind}>
      <div className="timeline-date">
        <span>{formatEventDate(event)}</span>
        <small>{humanise(event.datePrecision)}</small>
      </div>
      <span className="timeline-marker">
        <Icon aria-hidden="true" size={18} />
      </span>
      <article>
        <div className="timeline-event-heading">
          <span className="category-chip">
            {humanise(event.type)}
          </span>
          <span>{humanise(event.temporalLanguage)}</span>
        </div>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <small>Source: {humanise(event.sourceId.replace("source-", ""))}</small>
      </article>
    </li>
  );
}

function formatEventDate(event: TimelineEvent): string {
  if (!event.occurredAt) {
    return "Date unknown";
  }
  return new Date(event.occurredAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function humanise(value: string): string {
  const normalised = value
    .replace(/([a-z])([A-Z])/gu, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim();
  if (normalised.toLowerCase() === "otc use") {
    return "OTC use";
  }
  return normalised.replace(/^\w/u, (letter) => letter.toUpperCase());
}
