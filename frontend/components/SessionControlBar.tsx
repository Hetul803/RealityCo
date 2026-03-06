import { Mic, MicOff, PauseCircle, PlayCircle, ScanSearch, Sparkles, Square } from "lucide-react";

interface SessionControlBarProps {
  started: boolean;
  muted: boolean;
  frozen: boolean;
  busy: boolean;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onFreeze: () => void;
  onAnalyze: () => void;
  onClear: () => void;
}

const btn = "rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:bg-white/[0.08]";

export function SessionControlBar(props: SessionControlBarProps) {
  return (
    <div className="glass panel-glow rounded-2xl p-3">
      <p className="mb-2 px-1 text-xs uppercase tracking-[0.2em] text-white/45">Session controls</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={props.started ? props.onEnd : props.onStart}
          className="rounded-full bg-gradient-to-r from-accent to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
        >
          {props.started ? <Square className="mr-1 inline h-4 w-4" /> : <PlayCircle className="mr-1 inline h-4 w-4" />}
          {props.started ? "End session" : "Start session"}
        </button>
        <button onClick={props.onToggleMute} className={btn}>
          {props.muted ? <MicOff className="mr-1 inline h-4 w-4" /> : <Mic className="mr-1 inline h-4 w-4" />} {props.muted ? "Muted" : "Mic on"}
        </button>
        <button onClick={props.onFreeze} className={btn}>
          {props.frozen ? <PlayCircle className="mr-1 inline h-4 w-4" /> : <PauseCircle className="mr-1 inline h-4 w-4" />} {props.frozen ? "Resume live" : "Freeze frame"}
        </button>
        <button disabled={props.busy} onClick={props.onAnalyze} className={`${btn} disabled:opacity-40`}>
          <ScanSearch className="mr-1 inline h-4 w-4" /> Analyze current frame
        </button>
        <button onClick={props.onClear} className={btn}>
          <Sparkles className="mr-1 inline h-4 w-4" /> Clear overlays
        </button>
      </div>
    </div>
  );
}
