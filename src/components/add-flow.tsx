"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Camera,
  CheckCircle2,
  FileText,
  Keyboard,
  Mic,
  Pause,
  Radio,
  Upload,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "text" | "files" | "voice" | "live";
type ProgressStage =
  | "queued"
  | "reading_sources"
  | "extracting_facts"
  | "organising_suggestions"
  | "retrying"
  | "ready"
  | "failed";
export type AddFlowJob = {
  id: string;
  status: string;
  candidates?: Candidate[];
  failureDetail?: string | null;
  progressStage?: ProgressStage;
  progressDetail?: string | null;
  progressUpdatedAt?: string | null;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  attemptCount?: number;
};
type Candidate = {
  id: string;
  itemType: string;
  originalWording: string;
  normalizedWording: string;
  confidence: number;
  uncertainty?: string | null;
  details?: Record<string, unknown>;
};

const accept = [
  ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".doc", ".docx",
  ".txt", ".csv", ".xls", ".xlsx",
].join(",");

export function AddFlow({ userId, initialJob = null }: { userId: string; initialJob?: AddFlowJob | null }) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [job, setJob] = useState<AddFlowJob | null>(initialJob);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    async function restoreLatestIntake() {
      try {
        const latestResponse = await fetch("/api/intakes", {
          signal: controller.signal,
        });
        if (latestResponse.status === 204 || !latestResponse.ok) return;
        const latest = (await latestResponse.json()) as { id: string };
        const detailResponse = await fetch(`/api/intakes/${latest.id}`, {
          signal: controller.signal,
        });
        if (detailResponse.ok) setJob(await detailResponse.json());
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMessage(
            "Your last intake could not be restored. You can still add something new.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setRestoring(false);
      }
    }
    void restoreLatestIntake();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!job || !["queued", "processing"].includes(job.status)) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/intakes/${job.id}`);
      if (response.ok) setJob(await response.json());
    }, 2000);
    return () => window.clearInterval(timer);
  }, [job]);

  function chooseFiles(list: FileList | null) {
    const chosen = Array.from(list ?? []);
    const tooLarge = chosen.find((file) => file.size > 25 * 1024 * 1024);
    const total = chosen.reduce((sum, file) => sum + file.size, 0);
    if (tooLarge || total > 50 * 1024 * 1024) {
      setMessage(tooLarge ? `${tooLarge.name} is larger than 25 MB.` : "This batch is larger than 50 MB.");
      return;
    }
    setFiles(chosen);
    setMessage(null);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.current = mediaRecorder;
      chunks.current = [];
      mediaRecorder.ondataavailable = (event) => chunks.current.push(event.data);
      mediaRecorder.onstop = () => {
        const file = new File(chunks.current, `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        setFiles([file]);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setRecording(true);
    } catch {
      setMessage("Microphone access failed. You can upload a recording or type instead.");
    }
  }

  function stopRecording() {
    recorder.current?.stop();
    setRecording(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Storage is not configured.");
      const artifacts = [];
      for (const file of files) {
        const id = crypto.randomUUID();
        const path = `${userId}/${id}/${file.name.replace(/[^\w.\- ]/g, "_")}`;
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
        const { error } = await supabase.storage.from("health-sources").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
        artifacts.push({ id, storagePath: path, fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, sha256: hash });
      }
      const response = await fetch("/api/intakes", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          mode: mode === "files" ? "document" : mode === "voice" ? "voice_note" : mode === "live" ? "realtime_voice" : "text",
          text: text.trim() || undefined,
          artifacts,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your intake could not be created.");
      setJob(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your intake could not be created.");
    } finally {
      setBusy(false);
    }
  }

  if (job) return <CandidateReview job={job} onRestart={() => { setJob(null); setFiles([]); setText(""); }} />;

  if (restoring) {
    return (
      <div className="processing-state compact" role="status" aria-live="polite">
        <span className="processing-mark" aria-hidden="true" />
        <div>
          <p className="eyebrow">Checking your record</p>
          <h2>Looking for an intake already in progress</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="add-workspace">
      <div className="intake-tabs" role="tablist" aria-label="Ways to add information">
        <button role="tab" aria-selected={mode === "text"} onClick={() => setMode("text")}><Keyboard size={20} /> Write</button>
        <button role="tab" aria-selected={mode === "files"} onClick={() => setMode("files")}><Upload size={20} /> Photo or file</button>
        <button role="tab" aria-selected={mode === "voice"} onClick={() => setMode("voice")}><Mic size={20} /> Voice note</button>
        <button role="tab" aria-selected={mode === "live"} onClick={() => setMode("live")}><Radio size={20} /> Guided voice</button>
      </div>
      <form onSubmit={submit} className="intake-panel">
        {mode === "text" ? (
          <>
            <div className="intake-heading"><Keyboard size={27} /><div><h2>Tell us in your own words</h2><p>Medicines, conditions, symptoms, routines, tests, or anything else that belongs in your health picture.</p></div></div>
            <label className="sr-only" htmlFor="intake-text">Health information</label>
            <textarea id="intake-text" value={text} onChange={(event) => setText(event.target.value)} rows={12} placeholder="For example: I take amlodipine 5 mg every morning. I started magnesium last month. I’ve had headaches since Tuesday…" />
          </>
        ) : null}
        {mode === "files" ? (
          <>
            <div className="intake-heading"><Camera size={27} /><div><h2>Add photos or documents</h2><p>Prescription labels, letters, test results, medicine lists, and spreadsheets are welcome.</p></div></div>
            <label className="drop-zone">
              <Upload size={30} />
              <strong>Choose photos or files</strong>
              <span>PDF, JPEG, PNG, WebP, HEIC, Word, text, CSV, or Excel</span>
              <span>25 MB each · 50 MB per batch</span>
              <input type="file" multiple accept={accept} onChange={(event) => chooseFiles(event.target.files)} />
            </label>
          </>
        ) : null}
        {mode === "voice" ? (
          <>
            <div className="intake-heading"><AudioLines size={27} /><div><h2>Talk it through</h2><p>Record a voice note. Audio is transcribed for review and then discarded; SignalRx keeps the transcript, not the recording.</p></div></div>
            <div className={`recording-surface ${recording ? "is-recording" : ""}`}>
              <span className="recording-pulse" />
              <p>{recording ? "Recording now…" : files.length ? "Voice note ready" : "Your microphone is off"}</p>
              {recording ? <button type="button" className="button button-primary" onClick={stopRecording}><Pause size={18} /> Stop recording</button> : <button type="button" className="button button-secondary" onClick={startRecording}><Mic size={18} /> {files.length ? "Record again" : "Start recording"}</button>}
            </div>
          </>
        ) : null}
        {mode === "live" ? <RealtimeVoice onTranscript={setText} /> : null}
        {files.length ? <ul className="selected-files">{files.map((file) => <li key={`${file.name}-${file.size}`}><FileText size={18} /><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></li>)}</ul> : null}
        {message ? <p className="form-message" role="alert">{message}</p> : null}
        {mode !== "live" ? <button className="button button-primary intake-submit" disabled={busy || (!text.trim() && !files.length)}>{busy ? "Securing your sources…" : "Extract facts for my review"}</button> : null}
        <p className="candidate-boundary"><CheckCircle2 size={17} /> Extraction creates suggestions only. Nothing changes your record until you confirm it.</p>
      </form>
    </div>
  );
}

function RealtimeVoice({ onTranscript }: { onTranscript: (value: string) => void }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "failed">("idle");
  const peer = useRef<RTCPeerConnection | null>(null);

  async function connect() {
    setStatus("connecting");
    try {
      const tokenResponse = await fetch("/api/realtime/session", { method: "POST" });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenData.error);
      const pc = new RTCPeerConnection();
      peer.current = pc;
      const audio = document.createElement("audio");
      audio.autoplay = true;
      pc.ontrack = (event) => { audio.srcObject = event.streams[0]; };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(stream.getTracks()[0]);
      const channel = pc.createDataChannel("oai-events");
      channel.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "conversation.item.input_audio_transcription.completed") {
          onTranscript(payload.transcript || "");
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const model = tokenData.model;
      const answer = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`, {
        method: "POST",
        body: offer.sdp,
        headers: { Authorization: `Bearer ${tokenData.client_secret}`, "Content-Type": "application/sdp" },
      });
      if (!answer.ok) throw new Error("Realtime connection failed.");
      await pc.setRemoteDescription({ type: "answer", sdp: await answer.text() });
      setStatus("listening");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="realtime-surface">
      <Radio size={30} />
      <h2>Have a guided conversation</h2>
      <p>A voice guide will ask about medicines, health, routines, and anything you want to add. You can interrupt at any time.</p>
      {status === "failed" ? <p role="alert">Live voice could not connect. Use a voice note or write instead.</p> : null}
      <button type="button" className="button button-primary" onClick={connect} disabled={status === "connecting" || status === "listening"}>
        {status === "connecting" ? "Connecting…" : status === "listening" ? "Listening — speak naturally" : "Start guided voice"}
      </button>
    </div>
  );
}

function CandidateReview({ job, onRestart }: { job: AddFlowJob; onRestart: () => void }) {
  const candidates = useMemo(() => job.candidates ?? [], [job.candidates]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState(() => new Set(candidates.map((candidate) => candidate.id)));
  const [edits, setEdits] = useState<Record<string, string>>(
    () => Object.fromEntries(candidates.map((candidate) => [
      candidate.id,
      candidate.normalizedWording.trim() || candidate.originalWording.trim(),
    ])),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const retryRequests = useRef(new Set<number>());
  const hydratedCandidateIds = useRef(new Set(candidates.map((candidate) => candidate.id)));
  const isProcessing = ["queued", "processing"].includes(job.status);

  useEffect(() => {
    const newCandidates = candidates.filter(
      (candidate) => !hydratedCandidateIds.current.has(candidate.id),
    );
    if (!newCandidates.length) return;

    setSelected((current) => {
      const next = new Set(current);
      newCandidates.forEach((candidate) => next.add(candidate.id));
      return next;
    });
    setEdits((current) => {
      const next = { ...current };
      newCandidates.forEach((candidate) => {
        next[candidate.id] =
          candidate.normalizedWording.trim() ||
          candidate.originalWording.trim();
      });
      return next;
    });
    newCandidates.forEach((candidate) =>
      hydratedCandidateIds.current.add(candidate.id),
    );
  }, [candidates]);

  useEffect(() => {
    if (!isProcessing) return;
    const startedAt = job.createdAt
      ? new Date(job.createdAt).getTime()
      : Date.now();
    const updateElapsed = () =>
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [isProcessing, job.createdAt]);

  useEffect(() => {
    if (job.status !== "queued" || job.progressStage !== "retrying") return;
    const attempt = job.attemptCount ?? 0;
    if (retryRequests.current.has(attempt)) return;
    retryRequests.current.add(attempt);
    void fetch(`/api/intakes/${job.id}/retry`, { method: "POST" }).then((response) => {
      if (!response.ok) {
        setMessage("Automatic retry could not start. You can stop this intake and try again.");
      }
    });
  }, [job.id, job.status, job.progressStage, job.attemptCount]);

  async function confirmSelected() {
    const decisions = candidates
      .filter((candidate) => selected.has(candidate.id))
      .map((candidate) => {
        const suggested =
          candidate.normalizedWording.trim() ||
          candidate.originalWording.trim();
        const edited = edits[candidate.id]?.trim() || suggested;
        return candidate.normalizedWording.trim() && edited === candidate.normalizedWording
          ? { candidateId: candidate.id, action: "confirm" as const }
          : {
              candidateId: candidate.id,
              action: "correct" as const,
              corrected: {
                originalWording: edited,
                normalizedWording: edited,
                details: candidate.details ?? {},
              },
            };
      });
    if (!decisions.length) {
      setMessage("Select at least one suggestion to confirm.");
      return;
    }
    setBusy(true);
    const response = await fetch(`/api/intakes/${job.id}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decisions }),
    });
    if (response.ok) {
      setMessage("Confirmed. The selected facts are now part of your record.");
      setSelected(new Set());
    }
    else setMessage("We couldn’t confirm these facts. Your record has not changed.");
    setBusy(false);
  }

  async function cancelProcessing() {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/intakes/${job.id}/cancel`, {
      method: "POST",
    });
    const result = await response.json();
    if (response.ok) window.location.reload();
    else setMessage(result.error || "This intake could not be stopped.");
    setBusy(false);
  }

  if (isProcessing) {
    const stage =
      job.progressStage ??
      (job.status === "queued" ? "queued" : "extracting_facts");
    const linearStage =
      stage === "retrying" ? "queued" : stage === "failed" ? "queued" : stage;
    const activeIndex =
      {
        queued: 1,
        reading_sources: 2,
        extracting_facts: 3,
        organising_suggestions: 4,
        ready: 4,
      }[linearStage] ?? 1;
    const elapsed =
      elapsedSeconds < 60
        ? `${elapsedSeconds}s`
        : `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;
    const steps = [
      ["Received securely", "Your source is private and attached to this job."],
      ["Waiting for processing", "The secure worker will pick up the job."],
      ["Reading your sources", "Text, images, documents, or audio are being prepared."],
      ["Finding possible facts", "Nothing is added to your record at this stage."],
      ["Organising your review", "Suggestions are being prepared for your confirmation."],
    ];

    return (
      <div className="processing-state" role="status" aria-live="polite">
        <div className="processing-heading">
          <span className="processing-mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">Secure processing · {elapsed}</p>
            <h2>Finding facts for you to review</h2>
            <p>
              {job.progressDetail ??
                "Your intake is moving through the secure processing queue."}
            </p>
          </div>
        </div>
        <ol className="processing-timeline">
          {steps.map(([title, detail], index) => {
            const state =
              index < activeIndex
                ? "complete"
                : index === activeIndex
                  ? "active"
                  : "pending";
            return (
              <li key={title} data-state={state}>
                <span className="timeline-dot" aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </div>
              </li>
            );
          })}
        </ol>
        {stage === "retrying" ? (
          <p className="processing-retry">
            The last attempt did not finish. SignalRx is retrying safely
            {job.attemptCount ? ` (attempt ${job.attemptCount + 1} of 3)` : ""}.
          </p>
        ) : null}
        <p className="processing-away">
          You can leave this page. The job will continue independently, and no
          suggestion changes your record until you confirm it.
        </p>
        <button className="button button-ghost" type="button" onClick={cancelProcessing} disabled={busy}>
          {busy ? "Stopping…" : "Stop this intake"}
        </button>
        {message ? <p className="form-message" role="alert">{message}</p> : null}
      </div>
    );
  }
  if (job.status === "failed") {
    return <div className="teaching-empty"><h2>Extraction stopped safely</h2><p>{job.failureDetail || "No facts were added to your record."}</p><button className="button button-secondary" onClick={onRestart}>Start another intake</button></div>;
  }
  if (!candidates.length) {
    return <div className="teaching-empty"><h2>No suggested facts found</h2><p>Nothing has been added to your record. You can try again with a little more detail.</p><button className="button button-secondary" onClick={onRestart}>Start another intake</button></div>;
  }
  return (
    <div className="candidate-review">
      <div>
        <p className="eyebrow">Ready to review</p>
        <h2>{candidates.length} suggested {candidates.length === 1 ? "fact" : "facts"}</h2>
        <p>Everything is included by default. Scan the list, then modify or remove anything that is not right.</p>
      </div>
      <div className="review-summary" aria-live="polite">
        <CheckCircle2 size={18} aria-hidden="true" />
        <span><strong>{selected.size}</strong> of {candidates.length} will be added to your record</span>
      </div>
      <ul className="candidate-list">{candidates.map((candidate) => {
        const isSelected = selected.has(candidate.id);
        const isEditing = editingId === candidate.id;
        const suggested =
          edits[candidate.id]?.trim() ||
          candidate.normalizedWording.trim() ||
          candidate.originalWording.trim();
        const sourceDiffers =
          candidate.originalWording.trim().toLocaleLowerCase() !==
          suggested.toLocaleLowerCase();

        return (
          <li key={candidate.id} data-excluded={!isSelected || undefined}>
            <div className="candidate-list-row">
              <CheckCircle2 className="candidate-status-icon" size={22} aria-hidden="true" />
              <div className="candidate-copy">
                <small>{candidate.itemType.replaceAll("_", " ")}</small>
                <h3>{suggested}</h3>
                {sourceDiffers ? <p className="candidate-source">From your source: “{candidate.originalWording}”</p> : null}
                {candidate.uncertainty ? <p className="candidate-uncertainty">{candidate.uncertainty}</p> : null}
              </div>
              <div className="candidate-actions">
                <button
                  type="button"
                  className="button button-ghost button-compact"
                  onClick={() => setEditingId(isEditing ? null : candidate.id)}
                  disabled={!isSelected}
                  aria-expanded={isEditing}
                  aria-controls={`candidate-editor-${candidate.id}`}
                >
                  {isEditing ? "Done" : "Modify"}
                </button>
                <button
                  type="button"
                  className="button button-ghost button-compact"
                  onClick={() => {
                    setSelected((current) => {
                      const next = new Set(current);
                      if (isSelected) next.delete(candidate.id);
                      else next.add(candidate.id);
                      return next;
                    });
                    if (isSelected) setEditingId(null);
                  }}
                >
                  {isSelected ? "Remove" : "Restore"}
                </button>
              </div>
            </div>
            {isEditing ? (
              <div className="candidate-editor" id={`candidate-editor-${candidate.id}`}>
                <label htmlFor={`candidate-wording-${candidate.id}`}>How should this appear in your record?</label>
                <input
                  id={`candidate-wording-${candidate.id}`}
                  value={edits[candidate.id] ?? ""}
                  onChange={(event) => setEdits((current) => ({ ...current, [candidate.id]: event.target.value }))}
                  maxLength={500}
                  autoFocus
                />
              </div>
            ) : null}
          </li>
        );
      })}</ul>
      {message ? <p className={`form-message${message.startsWith("Confirmed.") ? " form-message-success" : ""}`} role="status">{message}</p> : null}
      <div className="review-actions"><button className="button button-primary" onClick={confirmSelected} disabled={busy || !selected.size}>{busy ? "Adding to your record…" : `Add ${selected.size} ${selected.size === 1 ? "fact" : "facts"} to my record`}</button><button className="button button-ghost" onClick={onRestart}>Add something else</button></div>
    </div>
  );
}
