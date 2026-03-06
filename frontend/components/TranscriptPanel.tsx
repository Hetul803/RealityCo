import { TranscriptEntry } from "@/lib/contracts";

export function TranscriptPanel({ transcript }: { transcript: TranscriptEntry[] }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/78">Live transcript</h3>
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">Voice stream</span>
      </div>
      <div className="h-[22rem] space-y-3 overflow-auto pr-1 text-sm">
        {transcript.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-white/50">
            Transcript appears here as soon as you start speaking. Keep prompts concise for faster turn-around.
          </div>
        ) : null}
        {transcript.map((entry, idx) => {
          const isUser = entry.role === "user";
          return (
            <div
              key={`${entry.timestamp}-${idx}`}
              className={`max-w-[94%] rounded-2xl px-4 py-3 ${
                isUser
                  ? "ml-auto border border-accent/35 bg-gradient-to-b from-accent/25 to-accent/10"
                  : "mr-auto border border-white/10 bg-white/[0.03]"
              }`}
            >
              <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/45">{isUser ? "You" : "Copilot"}</p>
              <p className="leading-relaxed text-white/92">{entry.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
