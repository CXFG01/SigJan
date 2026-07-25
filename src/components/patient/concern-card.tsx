import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  CircleHelp,
  MessageCircleQuestion,
} from "lucide-react";
import type { Concern, EvidenceRecord } from "@/domain";

const categoryTone: Record<Concern["category"], string> = {
  established_evidence: "coral",
  context_dependent: "amber",
  insufficient_evidence: "neutral",
};

const statusLabels: Record<Concern["status"], string> = {
  needs_professional_review: "Needs professional review",
  context_incomplete: "Context incomplete",
  insufficient_evidence: "Insufficient evidence",
};

export function ConcernCard({
  concern,
  evidence,
  index,
}: {
  concern: Concern;
  evidence: EvidenceRecord[];
  index: number;
}) {
  return (
    <article
      className="concern-card"
      data-tone={categoryTone[concern.category]}
    >
      <header className="concern-card-header">
        <div className="concern-index" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </div>
        <div className="concern-heading">
          <div className="concern-kicker">
            <span className="status-chip" data-status={concern.status}>
              {statusLabels[concern.status]}
            </span>
            <span>{concern.categoryLabel}</span>
          </div>
          <h2>{concern.title}</h2>
          <p className="concern-products">
            {concern.productNames.join(" + ")}
          </p>
        </div>
      </header>

      <div className="concern-body">
        <section className="concern-explanation">
          <div>
            <p className="field-label">Potential consequence</p>
            <p>{concern.potentialConsequence}</p>
          </div>
          <div>
            <p className="field-label">Why it may matter here</p>
            <p>{concern.whyItMayMatter}</p>
          </div>
          <div>
            <p className="field-label">Mechanism summary</p>
            <p>{concern.mechanismSummary}</p>
          </div>
        </section>

        <section
          aria-label="Independent concern dimensions"
          className="confidence-dimensions"
        >
          <Dimension
            label="Potential severity"
            value={humanise(concern.potentialSeverity)}
          />
          <Dimension
            label="Evidence strength"
            value={humanise(concern.evidenceStrength)}
          />
          <Dimension
            label="Patient-context match"
            value={humanise(concern.patientContextMatch)}
          />
          <Dimension
            label="Data completeness"
            value={humanise(concern.dataCompleteness)}
          />
        </section>

        {concern.missingInformation.length > 0 && (
          <section className="missing-context">
            <div className="missing-context-heading">
              <CircleHelp aria-hidden="true" size={19} />
              <h3>Information still needed</h3>
            </div>
            <ul>
              {concern.missingInformation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="professional-question">
          <MessageCircleQuestion aria-hidden="true" size={22} />
          <div>
            <p className="field-label">A question to take to the pharmacist</p>
            <p>“{concern.suggestedQuestion}”</p>
          </div>
        </section>

        <div className="evidence-stack">
          {evidence.map((record) => (
            <EvidenceDrawer key={record.id} record={record} />
          ))}
        </div>

        <footer className="concern-card-footer">
          <span>
            Review status:{" "}
            <strong>{humanise(concern.reviewStatus)}</strong>
          </span>
          <span>Rule {concern.ruleId} · v{concern.ruleVersion}</span>
        </footer>
      </div>
    </article>
  );
}

export function EvidenceDrawer({ record }: { record: EvidenceRecord }) {
  return (
    <details className="evidence-drawer">
      <summary>
        <span className="evidence-summary-icon">
          <BookOpen aria-hidden="true" size={18} />
        </span>
        <span>
          <strong>View evidence record</strong>
          <small>
            {record.organization} · {humanise(record.tier)}
          </small>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="evidence-chevron"
          size={18}
        />
      </summary>
      <div className="evidence-drawer-content">
        <div className="evidence-record-title">
          <span className="evidence-badge" data-tier={record.tier}>
            {humanise(record.tier)}
          </span>
          <h3>{record.title}</h3>
          <p>{record.organization}</p>
        </div>
        <dl className="evidence-metadata">
          <div>
            <dt>Evidence type</dt>
            <dd>{humanise(record.evidenceType)}</dd>
          </div>
          <div>
            <dt>Evidence state</dt>
            <dd>{humanise(record.state)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatDate(record.updatedDate)}</dd>
          </div>
          <div>
            <dt>Retrieved</dt>
            <dd>{formatDate(record.retrievedDate)}</dd>
          </div>
          <div>
            <dt>Jurisdiction</dt>
            <dd>{record.jurisdiction}</dd>
          </div>
          <div>
            <dt>Record version</dt>
            <dd>{record.version}</dd>
          </div>
        </dl>
        <div className="evidence-excerpt">
          <p className="field-label">Supporting excerpt</p>
          <blockquote>{record.exactSupportingExcerpt}</blockquote>
          {record.quotationStatus === "synthetic_paraphrase" && (
            <span>
              <AlertTriangle aria-hidden="true" size={15} />
              Synthetic demonstration paraphrase—not an official quotation.
            </span>
          )}
        </div>
        <div className="evidence-notes">
          <div>
            <h4>Applicability</h4>
            <ul>
              {record.applicabilityNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Limitations</h4>
            <ul>
              {record.limitations.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </details>
  );
}

function Dimension({ label, value }: { label: string; value: string }) {
  return (
    <div className="dimension">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function humanise(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/^\w/u, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
