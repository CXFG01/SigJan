"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Stethoscope, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { MarketingHeader } from "@/components/marketing-header";
import { useDemo } from "@/context/demo-provider";

const roles = [
  {
    id: "patient" as const,
    title: "I’m reviewing my medicines",
    description:
      "Bring together what the hospital listed and what you actually take at home.",
    destination: "/patient/intake",
    action: "Start Evelyn’s review",
    icon: UserRound,
  },
  {
    id: "caregiver" as const,
    title: "I’m helping someone else",
    description:
      "Check who gives each medicine, add observations, and share the reviewed plan.",
    destination: "/caregiver",
    action: "Open caregiver view",
    icon: HeartHandshake,
  },
  {
    id: "professional" as const,
    title: "I’m a pharmacist",
    description:
      "Review the reconciled list, inspect evidence, document decisions, and publish a plan.",
    destination: "/professional",
    action: "Open review queue",
    icon: Stethoscope,
  },
];

export default function DemoPage() {
  const router = useRouter();
  const { hydrated, setRole } = useDemo();

  function chooseRole(role: (typeof roles)[number]) {
    setRole(role.id);
    router.push(role.destination);
  }

  return (
    <div className="demo-page">
      <MarketingHeader />
      <main id="main-content" className="demo-main shell-width">
        <div className="demo-intro">
          <p className="eyebrow">Choose your view</p>
          <h1 className="page-title">One episode, three perspectives.</h1>
          <p className="body-large">
            Explore the same synthetic post-discharge medication story as
            Evelyn, her caregiver, or the reviewing pharmacist.
          </p>
        </div>

        <div className="role-grid">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                className="role-option"
                disabled={!hydrated}
                key={role.id}
                onClick={() => chooseRole(role)}
                type="button"
              >
                <span className="role-icon">
                  <Icon aria-hidden="true" size={23} />
                </span>
                <span>
                  <strong className="role-title">{role.title}</strong>
                  <p>{role.description}</p>
                </span>
                <span className="role-action">
                  {role.action} <ArrowRight aria-hidden="true" size={17} />
                </span>
              </button>
            );
          })}
        </div>

        <p className="muted">
          All names, events, records, and evidence in this demo are synthetic.
          Read the{" "}
          <Link className="text-link" href="/about/safety">
            safety and evidence boundaries
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
