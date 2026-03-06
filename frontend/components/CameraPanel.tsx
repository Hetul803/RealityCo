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

export function CameraPanel({ videoRef, frozenFrame, annotations, ready, state, overlayHint }: CameraPanelProps) {
  return (
    <div className="glass panel-glow relative overflow-hidden rounded-2xl p-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(122,139,255,0.15),transparent_28%)]" />
        {!ready ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <div className="max-w-md text-center">
              <p className="text-lg font-medium">Your live camera becomes the copilot canvas</p>
              <p className="mt-2 text-sm text-white/55">Start session to activate voice + vision, then run frame analysis for grounded overlays.</p>
            </div>
          </div>
        ) : frozenFrame ? (
          <img src={`data:image/jpeg;base64,${frozenFrame}`} alt="Frozen frame" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
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

        <OverlayCanvas annotations={annotations} />
      </div>
    </div>
  );
}
