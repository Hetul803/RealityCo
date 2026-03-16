"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AgentStatusPill } from "@/components/AgentStatusPill";
import { AmbientBackground } from "@/components/AmbientBackground";
import { CameraPanel } from "@/components/CameraPanel";
import { FloatingActionButtons } from "@/components/FloatingActionButtons";
import { LoadingStates } from "@/components/LoadingStates";
import { SceneInsightsPanel } from "@/components/SceneInsightsPanel";
import { SessionControlBar } from "@/components/SessionControlBar";
import { SessionTimelinePanel, type TimelineEntry } from "@/components/SessionTimelinePanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { analyzeFrame, createSession, sendTranscript } from "@/lib/api";
import { AnalysisResponse, Annotation, AppMode, SessionState, TranscriptEntry } from "@/lib/contracts";
import { captureFrame, getUserMediaStream, speakText } from "@/lib/media";

const QUESTIONS = [
  "Tell me about yourself",
  "Tell me about a time you resolved a conflict",
  "Tell me about a time you showed leadership",
  "Why do you want this role?",
  "Describe a failure and what you learned"
];

const FILLER_PATTERNS: Array<{ key: "um" | "uh" | "like" | "you know"; regex: RegExp }> = [
  { key: "um", regex: /\bum\b/gi },
  { key: "uh", regex: /\buh\b/gi },
  { key: "like", regex: /\blike\b/gi },
  { key: "you know", regex: /\byou\s+know\b/gi }
];

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function estimateFillerCounts(transcript: TranscriptEntry[]) {
  const counts: Record<"um" | "uh" | "like" | "you know", number> = { um: 0, uh: 0, like: 0, "you know": 0 };
  const text = transcript
    .filter((t) => t.role === "user")
    .map((t) => t.text)
    .join(" ");

  for (const pattern of FILLER_PATTERNS) {
    counts[pattern.key] = text.match(pattern.regex)?.length ?? 0;
  }

  return counts;
}

function estimateWpm(transcript: TranscriptEntry[]): number | null {
  const userEntries = transcript.filter((t) => t.role === "user");
  if (userEntries.length < 2) return null;

  const firstTs = new Date(userEntries[0].timestamp).getTime();
  const lastTs = new Date(userEntries[userEntries.length - 1].timestamp).getTime();
  const ms = Math.max(lastTs - firstTs, 1);
  const minutes = ms / 60000;
  const words = userEntries
    .map((e) => e.text.trim().split(/\s+/).filter(Boolean).length)
    .reduce((acc, cur) => acc + cur, 0);

  if (words < 8 || minutes <= 0) return null;
  return Math.round(words / minutes);
}

function paceHintFromWpm(wpm: number | null): string {
  if (wpm === null) return "Pace estimate: need a longer answer";
  if (wpm > 175) return `Pace estimate: slightly fast (${wpm} wpm)`;
  if (wpm < 105) return `Pace estimate: slightly slow (${wpm} wpm)`;
  return `Pace estimate: good (${wpm} wpm)`;
}

export default function LiveAppPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastCaptureRef = useRef<number | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<SessionState>("idle");
  const [mode, setMode] = useState<AppMode>("visual_guide");
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [muted, setMuted] = useState(false);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [insight, setInsight] = useState<AnalysisResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDelayHint, setAnalysisDelayHint] = useState(false);
  const [frameHint, setFrameHint] = useState<string | null>(null);
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [uiStatus, setUiStatus] = useState("Listening");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("rc_demo_helper_seen");
    setShowDemoGuide(!seen);
  }, []);

  const pushTimeline = useCallback((text: string) => {
    const now = new Date().toISOString();
    setTimeline((prev) => [{ id: `${Date.now()}-${Math.random()}`, text, timestamp: fmtTime(now) }, ...prev].slice(0, 5));
  }, []);

  const addTranscript = useCallback((role: "user" | "assistant", text: string) => {
    setTranscript((prev) => [...prev, { role, text, timestamp: new Date().toISOString() }]);
  }, []);

  const fillerCounts = useMemo(() => estimateFillerCounts(transcript), [transcript]);
  const liveFillerHint = useMemo(
    () => `Filler words (transcript estimate): um(${fillerCounts.um}) uh(${fillerCounts.uh}) like(${fillerCounts.like}) you know(${fillerCounts["you know"]})`,
    [fillerCounts]
  );
  const livePaceHint = useMemo(() => paceHintFromWpm(estimateWpm(transcript)), [transcript]);

  const onFinalSpeech = useCallback(
    async (text: string) => {
      if (!sessionId || muted || isAnalyzing) return;
      addTranscript("user", text);
      setUiStatus("Processing transcript");
      setState("thinking");
      try {
        const response = await sendTranscript(sessionId, text);
        addTranscript("assistant", response.spoken_text);
        setUiStatus("Speaking response");
        speakText(response.spoken_text);
        setState("agent_speaking");
        setTimeout(() => {
          setState("listening");
          setUiStatus("Listening");
        }, 900);
      } catch {
        setState("error");
        setUiStatus("Error");
        setError("AI analysis temporarily unavailable. Try again.");
      }
    },
    [addTranscript, isAnalyzing, muted, sessionId]
  );

  const speech = useSpeechInput(onFinalSpeech);

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisDelayHint(false);
      return;
    }
    const t = setTimeout(() => setAnalysisDelayHint(true), 4200);
    return () => clearTimeout(t);
  }, [isAnalyzing]);

  const startSession = useCallback(async () => {
    try {
      setError(null);
      setUiStatus("Connecting");
      setState("connecting");
      const created = await createSession();
      setSessionId(created.session_id);

      try {
        const media = await getUserMediaStream(true, true);
        setStream(media);
        if (videoRef.current) videoRef.current.srcObject = media;
      } catch {
        if (mode === "visual_guide") {
          throw new Error("Camera unavailable — allow camera access for Visual Guide mode.");
        }
        addTranscript("assistant", "Camera unavailable — transcript-only coaching will still work.");
        setError("Camera unavailable — transcript-only coaching will still work.");
      }

      setState("listening");
      setUiStatus("Listening");
      if (speech.isSupported) speech.start();
      if (!speech.isSupported) {
        addTranscript("assistant", "Speech recognition is unavailable in this browser, but analysis is still available.");
      }
      pushTimeline("Session started");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
      setState("error");
      setUiStatus("Error");
    }
  }, [addTranscript, mode, pushTimeline, speech]);

  const endSession = useCallback(() => {
    speech.stop();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setState("idle");
    setFrozenFrame(null);
    setSessionId(null);
    setIsAnalyzing(false);
    setAnnotations([]);
    setInsight(null);
    setUiStatus("Idle");
    pushTimeline("Session ended");
  }, [pushTimeline, speech, stream]);

  const toggleMute = useCallback(() => {
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    });
  }, [stream]);

  const freeze = useCallback(() => {
    if (!videoRef.current || !stream || isAnalyzing) return;
    if (frozenFrame) {
      setFrozenFrame(null);
      return;
    }
    setFrozenFrame(captureFrame(videoRef.current));
  }, [frozenFrame, isAnalyzing, stream]);

  const runAnalysis = useCallback(async () => {
    if (!sessionId || isAnalyzing) return;
    if (mode === "interview_coach" && transcript.filter((t) => t.role === "user").length === 0) {
      setError("Speak an answer before requesting coaching.");
      return;
    }

    setError(null);
    setFrameHint(null);
    setUiStatus(mode === "interview_coach" ? "Generating response" : "Analyzing frame");
    setState("analyzing_visual_context");
    setIsAnalyzing(true);

    try {
      const now = Date.now();
      const image = videoRef.current && stream ? frozenFrame ?? captureFrame(videoRef.current) : undefined;

      if (image) {
        const delta = lastCaptureRef.current ? now - lastCaptureRef.current : null;
        lastCaptureRef.current = now;
        const lowQuality = image.length < 12000;
        const tooFast = delta !== null && delta < 700;
        if (lowQuality || tooFast) {
          setFrameHint("Hold camera steady for better analysis.");
        }
      }

      const response = await analyzeFrame({
        session_id: sessionId,
        mode,
        prompt:
          mode === "interview_coach"
            ? "Coach this interview answer with concise, actionable feedback."
            : frozenFrame
              ? "Explain this frozen frame and what to focus on."
              : "Analyze what is currently visible.",
        image_base64: image,
        freeze_mode: Boolean(frozenFrame),
        recent_transcript: transcript.slice(-10).map((t) => `${t.role}: ${t.text}`),
        selected_question: selectedQuestion || undefined
      });

      setInsight(response);
      if (response.mode === "visual_guide") {
        setAnnotations(response.annotations);
        pushTimeline(response.annotations.length > 0 ? `${response.annotations.length} overlay highlights detected` : "Frame analyzed");
      } else {
        setAnnotations([]);
        pushTimeline("Interview answer coached");
      }

      const spoken = response.mode === "interview_coach" ? response.spoken_feedback : response.spoken_text;
      addTranscript("assistant", spoken);
      setUiStatus("Speaking response");
      speakText(spoken);
      setState("agent_speaking");
      setTimeout(() => {
        setState("listening");
        setUiStatus("Listening");
      }, 900);

      if (showDemoGuide && typeof window !== "undefined") {
        window.localStorage.setItem("rc_demo_helper_seen", "1");
        setShowDemoGuide(false);
      }
    } catch {
      setState("error");
      setUiStatus("Error");
      setError("AI analysis temporarily unavailable. Try again.");
      addTranscript("assistant", "I couldn't complete that analysis. Please retry with a fuller answer or steadier frame.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    addTranscript,
    frozenFrame,
    isAnalyzing,
    mode,
    selectedQuestion,
    sessionId,
    showDemoGuide,
    stream,
    transcript,
    pushTimeline
  ]);

  const subtitle = useMemo(() => {
    if (error) return error;
    if (speech.interimText) return `Listening: ${speech.interimText}`;
    if (isAnalyzing) return mode === "interview_coach" ? "Coaching your answer with Gemini…" : "Analyzing frame with Gemini…";
    return mode === "interview_coach"
      ? "Transcript-first coaching with optional frame context."
      : "Live voice-and-vision guidance with grounded frame analysis.";
  }, [error, isAnalyzing, mode, speech.interimText]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8">
      <AmbientBackground />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-mint/80">Reality Copilot · Live studio</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{mode === "interview_coach" ? "Interview coach" : "Voice + vision cockpit"}</h1>
          <p className="mt-1 text-sm text-white/65">{subtitle}</p>
        </div>
        <AgentStatusPill state={state} customLabel={uiStatus} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setMode("visual_guide")}
          className={`rounded-full px-4 py-2 text-sm transition ${mode === "visual_guide" ? "bg-accent text-white" : "glass text-white/70 hover:text-white"}`}
        >
          Visual Guide
        </button>
        <button
          onClick={() => setMode("interview_coach")}
          className={`rounded-full px-4 py-2 text-sm transition ${mode === "interview_coach" ? "bg-accent text-white" : "glass text-white/70 hover:text-white"}`}
        >
          Interview Coach
        </button>
        {mode === "interview_coach" ? <span className="glass rounded-full px-3 py-1 text-xs text-white/65">{liveFillerHint}</span> : null}
      </div>

      {mode === "interview_coach" ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => setSelectedQuestion(question)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                selectedQuestion === question ? "border-mint bg-mint/15 text-white" : "border-white/15 bg-white/[0.03] text-white/70 hover:text-white"
              }`}
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}

      {showDemoGuide ? (
        <div className="glass mb-4 rounded-2xl p-4 text-sm text-white/70">
          <p className="font-medium text-white/90">Try these demo flows</p>
          <p className="mt-1">• Visual Guide: point camera at an object and analyze the frame.</p>
          <p className="mt-1">• Interview Coach: answer a question out loud and click “Coach My Answer”.</p>
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-xl p-3 text-xs text-white/65">
          <p className="uppercase tracking-[0.2em] text-white/40">Mode</p>
          <p className="mt-1 text-sm text-white">{mode === "interview_coach" ? "Interview Coach" : "Visual Guide"}</p>
        </div>
        <div className="glass rounded-xl p-3 text-xs text-white/65">
          <p className="uppercase tracking-[0.2em] text-white/40">Session</p>
          <p className="mt-1 truncate text-sm text-white">{sessionId ?? "Not started"}</p>
        </div>
        <div className="glass rounded-xl p-3 text-xs text-white/65">
          <p className="uppercase tracking-[0.2em] text-white/40">Flow</p>
          <p className="mt-1 text-sm text-white">{mode === "interview_coach" ? "Answer → Coach My Answer" : "Speak → Analyze frame"}</p>
        </div>
      </div>

      {!sessionId ? (
        <div className="glass mb-4 rounded-2xl p-4 text-sm text-white/65">
          <p className="mb-2 text-white/85">First run checklist</p>
          <div className="flex flex-wrap gap-2">
            {["Start session", "Allow permissions", "Speak naturally", mode === "interview_coach" ? "Coach My Answer" : "Analyze frame"].map((step, idx) => (
              <span key={step} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {idx + 1}. {step}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/55">Interview Coach is transcript-first. Camera context is optional and limited to visible setup cues.</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[2.15fr_1fr]">
        <div className="space-y-4">
          <CameraPanel
            videoRef={videoRef}
            frozenFrame={frozenFrame}
            annotations={annotations}
            ready={Boolean(stream)}
            state={state}
            frameHint={frameHint}
            overlayHint={
              isAnalyzing
                ? mode === "interview_coach"
                  ? "Coaching answer…"
                  : "Analyzing latest frame…"
                : mode === "visual_guide" && annotations.length > 0
                  ? `${annotations.length} highlights detected`
                  : null
            }
          />
          <SessionControlBar
            started={Boolean(sessionId)}
            muted={muted}
            frozen={Boolean(frozenFrame)}
            busy={isAnalyzing || state === "thinking" || state === "connecting"}
            analyzeLabel={mode === "interview_coach" ? "Coach My Answer" : "Analyze frame"}
            onStart={startSession}
            onEnd={endSession}
            onToggleMute={toggleMute}
            onFreeze={freeze}
            onAnalyze={runAnalysis}
            onClear={() => setAnnotations([])}
          />
          <WaveformVisualizer active={speech.isListening || state === "agent_speaking"} />
          {isAnalyzing ? (
            <LoadingStates
              text={
                analysisDelayHint
                  ? "Still working… Gemini is taking longer than usual."
                  : mode === "interview_coach"
                    ? "Coaching your answer with Gemini…"
                    : "Analyzing current frame with Gemini…"
              }
            />
          ) : null}
          {error ? <LoadingStates tone="error" text={error} /> : null}
        </div>
        <div className="space-y-4">
          <SceneInsightsPanel insight={insight} mode={mode} liveFillerHint={mode === "interview_coach" ? liveFillerHint : undefined} livePaceHint={mode === "interview_coach" ? livePaceHint : undefined} />
          <SessionTimelinePanel entries={timeline} />
          <TranscriptPanel transcript={transcript} />
        </div>
      </div>
      <FloatingActionButtons />
    </main>
  );
}
