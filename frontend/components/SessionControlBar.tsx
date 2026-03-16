import { Mic, MicOff, PauseCircle, PlayCircle, ScanSearch, Sparkles, Square, Brain, ToggleLeft } from "lucide-react";

interface SessionControlBarProps {
  started: boolean;
  muted: boolean;
  frozen: boolean;
  busy: boolean;
  analyzeLabel: string;
  autoAnalysis: boolean;
  voiceCommandMode: boolean;
  nextAnalysisCountdown: number | null;
  lastVoiceCommand: string | null;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onFreeze: () => void;
  onAnalyze: () => void;
  onClear: () => void;
  onToggleAutoAnalysis: () => void;
  onToggleVoiceCommands: () => void;
}

const btn = "rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:bg-white/[0.08]";

export function SessionControlBar(props: SessionControlBarProps) {
  return (
    <div className="glass panel-glow rounded-2xl p-3">
      <p className="mb-2 px-1 text-xs uppercase tracking-[0.2em] text-white/45">Session controls</p>
      
      {/* Voice Command Status */}
      {props.lastVoiceCommand && (
        <div className="mb-3 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs text-mint animate-pulse">
          {props.lastVoiceCommand}
        </div>
      )}

      {/* Auto Analysis Countdown */}
      {props.nextAnalysisCountdown !== null && (
        <div className="mb-3 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-xs text-amber">
          🧠 Auto-analysis in: {props.nextAnalysisCountdown}s
        </div>
      )}

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
          <ScanSearch className="mr-1 inline h-4 w-4" /> {props.analyzeLabel}
        </button>
        
        <button onClick={props.onClear} className={btn}>
          <Sparkles className="mr-1 inline h-4 w-4" /> Clear overlays
        </button>
        
        <button 
          onClick={props.onToggleAutoAnalysis} 
          className={`${btn} ${props.autoAnalysis ? 'bg-mint/20 border-mint/40' : ''}`}
        >
          <Brain className="mr-1 inline h-4 w-4" /> 
          {props.autoAnalysis ? "Auto ON" : "Auto OFF"}
        </button>
        
        <button 
          onClick={props.onToggleVoiceCommands}
          className={`${btn} ${props.voiceCommandMode ? 'bg-accent/20 border-accent/40' : ''}`}
        >
          <ToggleLeft className="mr-1 inline h-4 w-4" />
          {props.voiceCommandMode ? "Voice ON" : "Voice OFF"}
        </button>
      </div>
      
      {/* Voice Commands Help */}
      {props.voiceCommandMode && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
          <p className="font-medium text-white/90 mb-2">🎤 Voice Commands:</p>
          <div className="space-y-1">
            <p>• "Reality, analyze frame" → Run analysis</p>
            <p>• "Reality, freeze" → Freeze video</p>
            <p>• "Reality, auto on" → Enable auto-analysis</p>
            <p>• "What do you see?" → Auto-trigger analysis</p>
          </div>
        </div>
      )}
    </div>
  );
}
