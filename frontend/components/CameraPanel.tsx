"use client";

import { RefObject } from "react";

import { SessionState, Annotation } from "@/lib/contracts";

import { OverlayCanvas } from "./OverlayCanvas";

interface CameraPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  frozenFrame: string | null;
  annotations: Annotation[];
  ready: boolean;
  state: SessionState;
  overlayHint?: string | null;
  frameHint?: string | null;
  autoAnalysis: boolean;
  nextAnalysisCountdown: number | null;
}

const stateLabel: Record<SessionState, string> = {
  idle: "Idle",
  connecting: "Connecting",
  listening: "Listening",
  user_speaking: "You are speaking",
  analyzing_visual_context: "Analyzing visual context",
  thinking: "Thinking",
  agent_speaking: "Agent speaking",
  error: "Error"
};

export function CameraPanel({ videoRef, frozenFrame, annotations, ready, state, overlayHint, frameHint, autoAnalysis, nextAnalysisCountdown }: CameraPanelProps) {
  return (
    <div className="glass panel-glow relative overflow-hidden rounded-2xl p-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(122,139,255,0.15),transparent_28%)]" />
        
        {/* Auto Analysis Indicator */}
        {autoAnalysis && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-30 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs text-mint animate-pulse">
            🧠 Auto-Analysis Active
          </div>
        )}

        {!ready ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <div className="max-w-md text-center">
              <p className="text-lg font-medium">Your live camera becomes AI copilot canvas</p>
              <p className="mt-2 text-sm text-white/55">Start session to activate voice + vision, then enable auto-analysis for continuous intelligence.</p>
            </div>
          </div>
        ) : frozenFrame ? (
          <img src={`data:image/jpeg;base64,${frozenFrame}`} alt="Frozen frame" className="h-full w-full object-cover" />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="h-full w-full object-cover"
            style={{ 
              transform: 'scaleX(-1)',
              backgroundColor: '#000',
              minHeight: '100%',
              minWidth: '100%'
            }}
            onLoadStart={() => console.log("Video loading started")}
            onLoadedData={() => console.log("Video data loaded")}
            onCanPlay={() => console.log("Video can play")}
            onError={(e) => console.error("Video error:", e)}
          />
        )}

        {/* Quality Indicators */}
        {ready && !frozenFrame && (
          <div className="absolute top-3 right-3 z-30 flex flex-col gap-1">
            <div className="rounded-full border border-green/30 bg-green/10 px-2 py-1 text-xs text-green">
              📹 LIVE
            </div>
            {autoAnalysis && (
              <div className="rounded-full border border-blue/30 bg-blue/10 px-2 py-1 text-xs text-blue">
                🔄 Auto
              </div>
            )}
          </div>
        )}

        <div className="absolute left-3 top-3 z-30 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs text-white/85">
          {stateLabel[state]}
        </div>
        {frozenFrame ? (
          <div className="absolute right-3 top-3 z-30 rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs text-amber-200">
            Freeze mode
          </div>
        ) : null}
        {overlayHint ? (
          <div className="absolute bottom-3 left-3 z-30 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs text-white/80">{overlayHint}</div>
        ) : null}
        {frameHint ? (
          <div className="absolute bottom-3 right-3 z-30 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs text-amber-200">{frameHint}</div>
        ) : null}

        <OverlayCanvas annotations={annotations} />
      </div>
    </div>
  );
}
