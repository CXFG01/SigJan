"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
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
type Job = { id: string; status: string; candidates?: Candidate[]; failureDetail?: string | null };
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

export function AddFlow({ userId }: { userId: string }) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

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

function CandidateReview({ job, onRestart }: { job: Job; onRestart: () => void }) {
  const candidates = job.candidates ?? [];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function confirmAll() {
    setBusy(true);
    const response = await fetch(`/api/intakes/${job.id}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decisions: candidates.map((candidate) => ({ candidateId: candidate.id, action: "confirm" })) }),
    });
    if (response.ok) setMessage("Confirmed. These facts are now part of your record.");
    else setMessage("We couldn’t confirm these facts. Your record has not changed.");
    setBusy(false);
  }

  if (["queued", "processing"].includes(job.status)) {
    return <div className="processing-state"><span className="processing-mark" /><p className="eyebrow">Secure processing</p><h2>Finding facts for you to review</h2><p>You can leave this page. The job will continue and retry independently.</p></div>;
  }
  if (job.status === "failed") {
    return <div className="teaching-empty"><h2>Extraction stopped safely</h2><p>{job.failureDetail || "No facts were added to your record."}</p><button className="button button-secondary" onClick={onRestart}>Start another intake</button></div>;
  }
  return (
    <div className="candidate-review">
      <div><p className="eyebrow">Your review</p><h2>Check every suggested fact</h2><p>Original wording stays beside the normalised suggestion. Edit or reject anything that is not right.</p></div>
      <ul>{candidates.map((candidate) => <li key={candidate.id}><label><input type="checkbox" defaultChecked /><span><small>{candidate.itemType.replaceAll("_", " ")}</small><strong>{candidate.normalizedWording}</strong><em>Source said: “{candidate.originalWording}”</em>{candidate.uncertainty ? <p>{candidate.uncertainty}</p> : null}</span></label></li>)}</ul>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <div className="review-actions"><button className="button button-primary" onClick={confirmAll} disabled={busy || !candidates.length}>{busy ? "Confirming…" : "Confirm selected facts"}</button><button className="button button-ghost" onClick={onRestart}>Add something else</button></div>
    </div>
  );
}
