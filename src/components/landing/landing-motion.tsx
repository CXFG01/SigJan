"use client";

import { useLayoutEffect } from "react";

const REVEAL_SELECTOR = "[data-signal-reveal]";

export function LandingMotion() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".signal-landing");

    if (!root) {
      return;
    }

    const revealers = Array.from(
      root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      root.dataset.motion = "reduced";
      revealers.forEach((element) => {
        element.dataset.signalRevealState = "visible";
      });
      return;
    }

    const show = (element: HTMLElement) => {
      element.dataset.signalRevealState = "visible";
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          show(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12,
      },
    );

    revealers.forEach((element) => {
      const bounds = element.getBoundingClientRect();

      if (bounds.top < window.innerHeight * 0.9) {
        show(element);
      } else {
        observer.observe(element);
      }
    });

    root.dataset.motion = "ready";

    return () => {
      observer.disconnect();
      delete root.dataset.motion;
    };
  }, []);

  return null;
}
