import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";

export default function NotFound() {
  return (
    <div className="content-page">
      <MarketingHeader />
      <main
        className="shell-width"
        id="main-content"
        style={{
          display: "grid",
          minHeight: "calc(100svh - 4.5rem)",
          alignContent: "center",
          gap: "var(--space-lg)",
          paddingBlock: "var(--space-3xl)",
        }}
      >
        <p className="eyebrow">Page not found</p>
        <h1 className="page-title">This part of the story is missing.</h1>
        <p className="body-large">
          Return to the demo and choose a patient, caregiver, or pharmacist
          route.
        </p>
        <div>
          <Link className="button button-primary" href="/demo">
            <ArrowLeft aria-hidden="true" size={17} />
            Back to demo roles
          </Link>
        </div>
      </main>
    </div>
  );
}
