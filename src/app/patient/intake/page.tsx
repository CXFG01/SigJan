"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  FileText,
  Keyboard,
  Mic2,
  Sparkles,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  ManualMedicationForm,
  type ManualMedicationValues,
} from "@/components/intake/manual-medication-form";
import { useDemo } from "@/context/demo-provider";

type CaptureMethod = "document" | "box" | "voice" | "manual";

const methods = [
  {
    id: "document" as const,
    title: "Document",
    copy: "Discharge letter or medicine list",
    icon: FileText,
  },
  {
    id: "box" as const,
    title: "Medicine box",
    copy: "Label or package photograph",
    icon: Camera,
  },
  {
    id: "voice" as const,
    title: "Voice recap",
    copy: "Editable spoken recollection",
    icon: Mic2,
  },
  {
    id: "manual" as const,
    title: "Type it in",
    copy: "Add one product at a time",
    icon: Keyboard,
  },
];

const sourceLedger = [
  {
    id: "discharge_document",
    title: "Hospital discharge letter",
    detail: "4 candidate prescriptions",
    icon: FileText,
  },
  {
    id: "medicine_box",
    title: "Home medicine-box photos",
    detail: "1 uncertain strength",
    icon: Camera,
  },
  {
    id: "voice_note",
    title: "Evelyn’s voice recap",
    detail: "2 products added at home",
    icon: Mic2,
  },
];

const demoTranscript =
  "I take the hospital tablets each morning. I still have the old Cardizem box at home but I’m not sure if I should be using it. For my knee I take ibuprofen sometimes, and I take a ginkgo tablet every day. I don’t know the strength.";

export default function IntakePage() {
  const {
    episode,
    hydrated,
    intakeSources,
    importSource,
    importAllDemoSources,
    addManualMedication,
  } = useDemo();
  const [method, setMethod] = useState<CaptureMethod>("document");
  const [fileName, setFileName] = useState("");
  const [transcript, setTranscript] = useState(demoTranscript);
  const [announcement, setAnnouncement] = useState("");
  const [processing, setProcessing] = useState(false);

  const importedCount = intakeSources.length;
  const candidateCount = episode.medicationEntries.length;
  const hasCandidates = candidateCount > 0;
  const allImported = sourceLedger.every((source) =>
    intakeSources.includes(source.id),
  );
  const currentImported = useMemo(() => {
    const sourceId =
      method === "document"
        ? "discharge_document"
        : method === "box"
          ? "medicine_box"
          : method === "voice"
            ? "voice_note"
            : "";
    return sourceId ? intakeSources.includes(sourceId) : false;
  }, [intakeSources, method]);

  async function processCurrentSource() {
    const sourceId: "discharge_document" | "medicine_box" | "voice_note" =
      method === "document"
        ? "discharge_document"
        : method === "box"
          ? "medicine_box"
          : "voice_note";
    setProcessing(true);
    try {
      await importSource(
        sourceId,
        method === "voice" ? transcript : undefined,
      );
      setAnnouncement(
        "Demo extraction complete. Source-specific candidate fields were added as needing confirmation.",
      );
    } catch {
      setAnnouncement(
        "The synthetic source could not be processed. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  }

  function addManual(values: ManualMedicationValues) {
    addManualMedication(values);
    setAnnouncement(
      `${values.enteredName} was added and still needs confirmation.`,
    );
  }

  async function useSeededSources() {
    setProcessing(true);
    try {
      await importAllDemoSources();
      setAnnouncement(
        "All three synthetic sources were added. Seven medicines and products are ready to check.",
      );
    } catch {
      setAnnouncement(
        "The seeded sources could not be loaded. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AppShell
      actions={
        <button
          className="button button-secondary"
          disabled={!hydrated || processing}
          onClick={useSeededSources}
          type="button"
        >
          <Sparkles aria-hidden="true" size={17} />
          Use Evelyn’s seeded sources
        </button>
      }
      description="Start with every source you have. Candidate fields remain provisional until you check them on the next step."
      eyebrow="Step 1 of 6 · Gather the record"
      mode="patient"
      title="What is Evelyn taking now?"
    >
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="app-stack">
        <section className="source-methods" aria-label="Ways to add medicines">
          {methods.map((item) => {
            const Icon = item.icon;
            return (
              <button
                aria-pressed={method === item.id}
                className="source-method"
                key={item.id}
                onClick={() => setMethod(item.id)}
                type="button"
              >
                <span className="source-method-icon">
                  <Icon aria-hidden="true" size={20} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.copy}</small>
                </span>
              </button>
            );
          })}
        </section>

        <div className="capture-workspace">
          <section className="capture-panel">
            {method === "document" && (
              <>
                <div className="capture-panel-header">
                  <div>
                    <h2>Add a discharge document</h2>
                    <p>
                      This demo reads deterministic fixture data. The selected
                      file never leaves your browser.
                    </p>
                  </div>
                </div>
                {!currentImported ? (
                  <div className="drop-zone">
                    <div className="drop-zone-inner">
                      <span className="drop-zone-icon">
                        <Upload aria-hidden="true" size={23} />
                      </span>
                      <strong>
                        {fileName || "Choose a synthetic discharge document"}
                      </strong>
                      <p>PDF, Word, or image · demo processing only</p>
                      <label className="button button-secondary">
                        Choose file
                        <input
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          className="file-input"
                          onChange={(event) =>
                            setFileName(
                              event.target.files?.[0]?.name ||
                                "Synthetic discharge letter",
                            )
                          }
                          type="file"
                        />
                      </label>
                      <button
                        className="button button-primary"
                        disabled={!hydrated || processing}
                        onClick={processCurrentSource}
                        type="button"
                      >
                        {processing
                          ? "Processing source…"
                          : "Extract candidate fields"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <ExtractionResult
                    detail="4 prescriptions found · 2 fields need attention"
                    title="Discharge letter processed"
                  />
                )}
              </>
            )}

            {method === "box" && (
              <>
                <div className="capture-panel-header">
                  <div>
                    <h2>Add medicine-box images</h2>
                    <p>
                      Photograph the product name, ingredients, strength, and
                      formulation where possible.
                    </p>
                  </div>
                </div>
                {!currentImported ? (
                  <div className="drop-zone">
                    <div className="drop-zone-inner">
                      <span className="drop-zone-icon">
                        <Camera aria-hidden="true" size={23} />
                      </span>
                      <strong>
                        {fileName || "Choose or simulate a package photo"}
                      </strong>
                      <p>Exact brand and formulation stay visible for review.</p>
                      <label className="button button-secondary">
                        Choose image
                        <input
                          accept="image/*"
                          capture="environment"
                          className="file-input"
                          onChange={(event) =>
                            setFileName(
                              event.target.files?.[0]?.name ||
                                "Cardizem package photo",
                            )
                          }
                          type="file"
                        />
                      </label>
                      <button
                        className="button button-primary"
                        disabled={!hydrated || processing}
                        onClick={processCurrentSource}
                        type="button"
                      >
                        {processing
                          ? "Processing source…"
                          : "Extract label fields"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <ExtractionResult
                    detail="Brand match found · strength and current use remain uncertain"
                    title="Package photo processed"
                  />
                )}
              </>
            )}

            {method === "voice" && (
              <>
                <div className="capture-panel-header">
                  <div>
                    <h2>Review the voice transcript</h2>
                    <p>
                      Evelyn’s exact wording is preserved. Edit mistakes before
                      extracting candidate products.
                    </p>
                  </div>
                </div>
                {!currentImported ? (
                  <div className="transcript-box">
                    <div className="voice-wave" aria-hidden="true">
                      {Array.from({ length: 38 }, (_, index) => (
                        <span key={index} />
                      ))}
                    </div>
                    <div className="field">
                      <label htmlFor="voice-transcript">
                        Editable transcript
                      </label>
                      <textarea
                        className="textarea"
                        id="voice-transcript"
                        onChange={(event) => setTranscript(event.target.value)}
                        value={transcript}
                      />
                      <span className="field-hint">
                        Generated text cannot create a clinical concern.
                      </span>
                    </div>
                    <div className="voice-controls">
                      <button
                        className="button button-primary"
                        disabled={!hydrated || processing}
                        onClick={processCurrentSource}
                        type="button"
                      >
                        {processing
                          ? "Processing source…"
                          : "Extract candidate products"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <ExtractionResult
                    detail="Ibuprofen and ginkgo found · dates, dose, and exact product remain uncertain"
                    title="Voice recap processed"
                  />
                )}
              </>
            )}

            {method === "manual" && (
              <>
                <div className="capture-panel-header">
                  <div>
                    <h2>Add a product manually</h2>
                    <p>
                      “I don’t know” is a valid answer. Missing details become
                      review questions rather than assumptions.
                    </p>
                  </div>
                </div>
                <ManualMedicationForm onAdd={addManual} />
              </>
            )}
          </section>

          <aside className="capture-panel" aria-label="Imported sources">
            <div className="capture-panel-header">
              <div>
                <h2>Source ledger</h2>
                <p>
                  {importedCount} of {sourceLedger.length} demo sources imported
                </p>
              </div>
            </div>
            <div className="source-ledger">
              {sourceLedger.map((source) => {
                const Icon = source.icon;
                const imported = intakeSources.includes(source.id);
                return (
                  <div
                    className="source-ledger-item"
                    data-imported={imported}
                    key={source.id}
                  >
                    <span className="source-ledger-icon">
                      {imported ? (
                        <Check aria-hidden="true" size={17} />
                      ) : (
                        <Icon aria-hidden="true" size={17} />
                      )}
                    </span>
                    <span>
                      <strong>{source.title}</strong>
                      <small>{source.detail}</small>
                    </span>
                    <span className="source-status">
                      {imported ? "Imported" : "Not added"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className="utility-panel"
              data-tone="amber"
              style={{ marginTop: "var(--space-lg)" }}
            >
              <h3>Nothing is trusted yet</h3>
              <p>
                Extraction only creates candidates. Every item must be checked
                against its original source.
              </p>
            </div>
          </aside>
        </div>

        <div className="app-bottom-actions">
          <Link className="button button-ghost" href="/demo">
            Back to roles
          </Link>
          <div className="app-bottom-actions-end">
            {allImported ? (
              <span className="intake-completion">
                <Check aria-hidden="true" size={18} />
                Demo sources ready
              </span>
            ) : hasCandidates ? (
              <span className="intake-completion">
                <Check aria-hidden="true" size={18} />
                {candidateCount}{" "}
                {candidateCount === 1 ? "candidate" : "candidates"} ready
              </span>
            ) : (
              <span className="muted">
                Add at least one source to continue
              </span>
            )}
            <Link
              aria-disabled={!hasCandidates}
              className="button button-primary"
              href={hasCandidates ? "/patient/confirm" : "#"}
              tabIndex={hasCandidates ? undefined : -1}
            >
              Check extracted items <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ExtractionResult({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="capture-result">
      <div className="capture-result-heading">
        <Check aria-hidden="true" size={21} />
        <strong>{title}</strong>
      </div>
      <ul className="capture-result-list">
        <li>
          <Check aria-hidden="true" size={17} />
          {detail}
        </li>
        <li>
          <Check aria-hidden="true" size={17} />
          Original source preserved beside each candidate
        </li>
        <li>
          <Check aria-hidden="true" size={17} />
          All items marked “Needs confirmation”
        </li>
      </ul>
    </div>
  );
}
