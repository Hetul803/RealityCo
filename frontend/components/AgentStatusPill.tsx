import { SessionState } from "@/lib/contracts";

const stateConfig: Record<SessionState, { label: string; dot: string; ring: string }> = {
  idle: { label: "Idle", dot: "bg-white/60", ring: "shadow-white/20" },
  connecting: { label: "Connecting", dot: "bg-indigo-300", ring: "shadow-indigo-300/40" },
  listening: { label: "Listening", dot: "bg-mint", ring: "shadow-mint/50" },
  user_speaking: { label: "User speaking", dot: "bg-emerald-300", ring: "shadow-emerald-300/50" },
  analyzing_visual_context: { label: "Analyzing frame", dot: "bg-amber-300", ring: "shadow-amber-300/50" },
  thinking: { label: "Thinking", dot: "bg-violet-300", ring: "shadow-violet-300/50" },
  agent_speaking: { label: "Agent speaking", dot: "bg-accent", ring: "shadow-accent/60" },
  error: { label: "Error", dot: "bg-red-400", ring: "shadow-red-400/60" }
};

export function AgentStatusPill({ state }: { state: SessionState }) {
  const config = stateConfig[state];

  return (
    <span className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs text-white/90">
      <span className={`pulse-ring absolute left-[12px] top-[11px] h-2.5 w-2.5 rounded-full ${config.dot} opacity-60`} />
      <span className={`relative inline-block h-2.5 w-2.5 rounded-full ${config.dot} shadow-[0_0_14px] ${config.ring}`} />
      <span className="tracking-wide">{config.label}</span>
    </span>
  );
}
