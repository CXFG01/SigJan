"use client";

import { useLayoutEffect, useRef } from "react";
import {
  Activity,
  CalendarDays,
  FileText,
  Leaf,
  Pill,
  SunMedium,
  UserRound,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const sources = [
  { id: "label", target: "medicines" },
  { id: "prescription-am", target: "medicines" },
  { id: "prescription-pm", target: "medicines" },
  { id: "supplement", target: "supplements" },
  { id: "test", target: "tests" },
  { id: "letter", target: "appointments" },
  { id: "voice", target: "symptoms" },
];

type DestinationTransform = {
  x: number;
  y: number;
  scale: number;
};

const graphNodes = [
  {
    id: "you",
    className: "signal-graph-you",
    label: "You",
    detail: "Your confirmed record",
    icon: UserRound,
  },
  {
    id: "medicines",
    className: "signal-graph-medicines",
    label: "Your medicines",
    detail: "4 medicines",
    icon: Pill,
  },
  {
    id: "supplements",
    className: "signal-graph-supplements",
    label: "Supplements",
    detail: "Vitamin D3",
    icon: Leaf,
  },
  {
    id: "symptoms",
    className: "signal-graph-symptoms",
    label: "How you’ve felt",
    detail: "Dizziness",
    icon: Activity,
  },
  {
    id: "tests",
    className: "signal-graph-tests",
    label: "Tests",
    detail: "HbA1c result",
    icon: FileText,
  },
  {
    id: "appointments",
    className: "signal-graph-appointments",
    label: "Appointments",
    detail: "18 August",
    icon: CalendarDays,
  },
  {
    id: "life",
    className: "signal-graph-life",
    label: "Daily life",
    detail: "Meals and routines",
    icon: SunMedium,
  },
];

export function LifestyleMerge() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        "(min-width: 981px) and (prefers-reduced-motion: no-preference)",
        () => {
          const stage = section.querySelector<HTMLElement>("[data-merge-stage]");
          const graph = section.querySelector<HTMLElement>("[data-merge-graph]");
          const sourceDeck = section.querySelector<HTMLElement>(
            "[data-merge-source-deck]",
          );
          const nodes = Array.from(
            section.querySelectorAll<HTMLElement>("[data-merge-node]"),
          );
          const lines = Array.from(
            section.querySelectorAll<SVGPathElement>("[data-merge-line]"),
          );
          const progress = section.querySelector<HTMLElement>(
            "[data-merge-progress]",
          );

          if (!stage || !graph || !sourceDeck || !progress) {
            return;
          }

          const sourceCards = sources.flatMap(({ id }) => {
            const original = document.querySelector<HTMLElement>(
              `[data-intake-source="${id}"]`,
            );

            if (!original) {
              return [];
            }

            const clone = original.cloneNode(true) as HTMLElement;
            clone.classList.add("signal-carry-card");
            clone.removeAttribute("data-signal-reveal");
            clone.removeAttribute("data-signal-reveal-state");
            clone.removeAttribute("data-intake-source");
            clone.dataset.mergeSource = id;
            clone.setAttribute("aria-hidden", "true");
            clone.setAttribute("inert", "");
            sourceDeck.append(clone);

            return [clone];
          });

          section.dataset.mergeEnhanced = "true";

          const destinationVars = new Map<HTMLElement, DestinationTransform>();

          sourceCards.forEach((card) => {
            const sourceId = card.dataset.mergeSource ?? "";
            const targetId = sources.find(
              (source) => source.id === sourceId,
            )?.target;
            const target = section.querySelector<HTMLElement>(
              `[data-merge-node="${targetId}"]`,
            );

            if (!target) {
              return;
            }

            const cardBounds = card.getBoundingClientRect();
            const targetBounds = target.getBoundingClientRect();

            destinationVars.set(card, {
              x:
                targetBounds.left +
                targetBounds.width / 2 -
                cardBounds.left -
                cardBounds.width / 2,
              y:
                targetBounds.top +
                targetBounds.height / 2 -
                cardBounds.top -
                cardBounds.height / 2,
              scale:
                Math.min(
                  targetBounds.width / cardBounds.width,
                  targetBounds.height / cardBounds.height,
                ) * 0.82,
            });
          });

          gsap.set(graph, { opacity: 0.12, scale: 0.92 });
          gsap.set(sourceDeck, { opacity: 0 });
          gsap.set(nodes, { opacity: 0.08, scale: 0.78 });
          gsap.set(lines, { opacity: 0 });
          gsap.set(progress, { scaleX: 0, transformOrigin: "left center" });

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${Math.max(window.innerHeight * 2.5, 2200)}`,
              pin: stage,
              pinSpacing: true,
              scrub: 0.55,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefreshInit: () => timeline.progress(0),
              onUpdate: (self) => {
                section.style.setProperty(
                  "--signal-merge-progress",
                  self.progress.toFixed(3),
                );
              },
            },
          });

          timeline
            .to(progress, { scaleX: 1, duration: 1 }, 0)
            .to(sourceDeck, { opacity: 1, duration: 0.04 }, 0)
            .to(graph, { opacity: 1, scale: 1, duration: 0.42 }, 0.12)
            .to(
              sourceCards,
              {
                x: (index, element) => {
                  const card = element as HTMLElement;
                  return destinationVars.get(card)?.x ?? 0;
                },
                y: (index, element) => {
                  const card = element as HTMLElement;
                  return destinationVars.get(card)?.y ?? 0;
                },
                scale: (index, element) => {
                  const card = element as HTMLElement;
                  return destinationVars.get(card)?.scale ?? 0.34;
                },
                duration: 0.48,
              },
              0.08,
            )
            .to(
              nodes,
              { opacity: 1, scale: 1, stagger: 0.02, duration: 0.25 },
              0.24,
            )
            .to(
              lines,
              { opacity: 1, stagger: 0.018, duration: 0.2 },
              0.35,
            )
            .to(
              sourceCards,
              { opacity: 0, stagger: 0.006, duration: 0.1 },
              0.57,
            )
            .to(nodes, { scale: 1.025, duration: 0.07 }, 0.62)
            .to(nodes, { scale: 1, duration: 0.09 }, 0.69)
            .to(sourceDeck, { opacity: 0, duration: 0.05 }, 0.72);

          ScrollTrigger.refresh();

          return () => {
            timeline.scrollTrigger?.kill();
            timeline.kill();
            sourceCards.forEach((card) => card.remove());
            section.removeAttribute("data-merge-enhanced");
            section.style.removeProperty("--signal-merge-progress");
          };
        },
      );

      media.add(
        "(max-width: 980px), (prefers-reduced-motion: reduce)",
        () => {
          section.dataset.mergeMode = "static";

          return () => {
            section.removeAttribute("data-merge-mode");
          };
        },
      );
    }, section);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <section
      id="merge"
      className="signal-merge"
      aria-labelledby="merge-heading"
      ref={sectionRef}
    >
      <div className="signal-contours signal-contours-merge" aria-hidden="true" />

      <div className="signal-merge-pin" data-merge-stage>
        <div className="signal-page-width signal-merge-heading">
          <p className="signal-section-label">One connected record</p>
          <h2 id="merge-heading">Now the pieces find their place.</h2>
          <p>
            Each confirmed item gets a clear home around you. Connections
            organise your record—they do not claim one thing caused another.
          </p>
        </div>

        <div
          className="signal-page-width signal-merge-workspace"
          data-merge-workspace
        >
          <div
            className="signal-merge-source-deck"
            data-merge-source-deck
            aria-hidden="true"
          />

          <div className="signal-friendly-graph" data-merge-graph>
            <div
              className="signal-graph"
              role="img"
              aria-label="Example Lifestyle Network with You connected to four medicines, a supplement, a symptom, a test, an appointment, and daily life"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path data-merge-line d="M50 50 Q39 33 28 16" />
                <path data-merge-line d="M50 50 Q61 33 72 16" />
                <path data-merge-line d="M50 50 Q71 48 88 48" />
                <path data-merge-line d="M50 50 Q61 68 72 82" />
                <path data-merge-line d="M50 50 Q39 68 28 82" />
                <path data-merge-line d="M50 50 Q29 48 12 48" />
              </svg>
              {graphNodes.map(({ id, className, label, detail, icon: Icon }) => (
                <div
                  className={`signal-graph-node ${className}`}
                  data-merge-node={id}
                  key={id}
                >
                  <Icon size={25} aria-hidden="true" />
                  <strong>{label}</strong>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="signal-page-width signal-merge-meter" aria-hidden="true">
          <div>
            <span data-merge-progress />
          </div>
          <p>
            <span>What you bring</span>
            <span>Your network</span>
          </p>
        </div>
      </div>
    </section>
  );
}
