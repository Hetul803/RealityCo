"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AgentStatusPill } from "@/components/AgentStatusPill";
import { AmbientBackground } from "@/components/AmbientBackground";
import { CameraPanel } from "@/components/CameraPanel";
import { FloatingActionButtons } from "@/components/FloatingActionButtons";
import { LoadingStates } from "@/components/LoadingStates";
import { SceneInsightsPanel } from "@/components/SceneInsightsPanel";
import { SessionControlBar } from "@/components/SessionControlBar";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { analyzeFrame, createSession, sendTranscript } from "@/lib/api";
import { SessionState, TranscriptEntry, VisionAnalysisResponse } from "@/lib/contracts";
import { captureFrame, getUserMediaStream, speakText } from "@/lib/media";

const STARTUP_STEPS = ["Start session", "Allow mic/camera", "Ask a question", "Analyze frame"];

export default function LiveAppPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<SessionState>("idle");
  const [muted, setMuted] = useState(false);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<VisionAnalysisResponse["annotations"]>([]);
  const [insight, setInsight] = useState<VisionAnalysisResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDelayHint, setAnalysisDelayHint] = useState(false);

  const addTranscript = useCallback((role: "user" | "assistant", text: string) => {
    setTranscript((prev) => [...prev, { role, text, timestamp: new Date().toISOString() }]);
  }, []);

  const onFinalSpeech = useCallback(
    async (text: string) => {
      if (!sessionId || muted || isAnalyzing) return;
      addTranscript("user", text);
      setState("thinking");
      try {
        const response = await sendTranscript(sessionId, text);
        addTranscript("assistant", response.spoken_text);
        speakText(response.spoken_text);
        setState("agent_speaking");
        setTimeout(() => setState("listening"), 900);
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Voice response failed.");
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
      setState("connecting");
      const created = await createSession();
      const media = await getUserMediaStream(true, true);
      setStream(media);
      if (videoRef.current) videoRef.current.srcObject = media;
      setSessionId(created.session_id);
      setState("listening");
      if (speech.isSupported) speech.start();
      if (!speech.isSupported) {
        addTranscript("assistant", "Speech recognition is unavailable in this browser, but frame analysis is fully available.");
      }
    } catch {
      setError("Camera/mic access denied or blocked. Allow permissions, then retry Start session.");
      setState("error");
    }
  }, [addTranscript, speech]);

  const endSession = useCallback(() => {
    speech.stop();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setState("idle");
    setFrozenFrame(null);
    setSessionId(null);
    setIsAnalyzing(false);
    setAnnotations([]);
  }, [speech, stream]);

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
    if (!sessionId || !videoRef.current || !stream || isAnalyzing) return;
    setError(null);
    setState("analyzing_visual_context");
    setIsAnalyzing(true);
    try {
      const image = frozenFrame ?? captureFrame(videoRef.current);
      const response = await analyzeFrame({
        session_id: sessionId,
        prompt: frozenFrame ? "Explain this frozen frame and what to focus on." : "Analyze what is currently visible.",
        image_base64: image,
        freeze_mode: Boolean(frozenFrame),
        recent_transcript: transcript.slice(-6).map((t) => `${t.role}: ${t.text}`)
      });
      setInsight(response);
      setAnnotations(response.annotations);
      addTranscript("assistant", response.spoken_text);
      speakText(response.spoken_text);
      setState("listening");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Frame analysis failed.");
      addTranscript("assistant", "I couldn't complete that visual analysis. Please retry with a steadier frame.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [addTranscript, frozenFrame, isAnalyzing, sessionId, stream, transcript]);

  const subtitle = useMemo(() => {
    if (error) return error;
    if (speech.interimText) return `Listening: ${speech.interimText}`;
    if (isAnalyzing) return "Analyzing frame with Gemini…";
    return "Live voice-and-vision guidance with grounded frame analysis.";
  }, [error, isAnalyzing, speech.interimText]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8">
      <AmbientBackground />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-mint/80">Reality Copilot · Live studio</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Voice + vision cockpit</h1>
          <p className="mt-1 text-sm text-white/65">{subtitle}</p>
        </div>
        <AgentStatusPill state={state} />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-xl p-3 text-xs text-white/65">
          <p className="uppercase tracking-[0.2em] text-white/40">Mode</p>
          <p className="mt-1 text-sm text-white">Live camera + voice</p>
        </div>
        <div className="glass rounded-xl p-3 text-xs text-white/65">
          <p className="uppercase tracking-[0.2em] text-white/40">Session</p>
          <p className="mt-1 truncate text-sm text-white">{sessionId ?? "Not started"}</p>
        </div>
        <div className="glass rounded-xl p-3 text-xs text-white/65">
          <p className="uppercase tracking-[0.2em] text-white/40">Flow</p>
          <p className="mt-1 text-sm text-white">Speak → Analyze frame → Follow-up</p>
        </div>
      </div>

      {!stream ? (
        <div className="glass mb-4 rounded-2xl p-4 text-sm text-white/65">
          <p className="mb-2 text-white/85">First run checklist</p>
          <div className="flex flex-wrap gap-2">
            {STARTUP_STEPS.map((step, idx) => (
              <span key={step} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">{idx + 1}. {step}</span>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/55">If permissions were denied, use browser site settings to re-enable camera and microphone.</p>
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
            overlayHint={isAnalyzing ? "Analyzing latest frame…" : annotations.length > 0 ? `${annotations.length} highlights` : null}
          />
          <SessionControlBar
            started={Boolean(stream)}
            muted={muted}
            frozen={Boolean(frozenFrame)}
            busy={isAnalyzing || state === "thinking" || state === "connecting"}
            onStart={startSession}
            onEnd={endSession}
            onToggleMute={toggleMute}
            onFreeze={freeze}
            onAnalyze={runAnalysis}
            onClear={() => setAnnotations([])}
          />
          <WaveformVisualizer active={speech.isListening || state === "agent_speaking"} />
          {isAnalyzing ? (
            <LoadingStates text={analysisDelayHint ? "Still working… Gemini is taking a bit longer than usual." : "Analyzing current frame with Gemini…"} />
          ) : null}
          {error ? <LoadingStates tone="error" text={error} /> : null}
        </div>
        <div className="space-y-4">
          <SceneInsightsPanel insight={insight} />
          <TranscriptPanel transcript={transcript} />
        </div>
      </div>
      <FloatingActionButtons />
    </main>
  );
}
