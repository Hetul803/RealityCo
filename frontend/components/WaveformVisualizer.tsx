"use client";

export function WaveformVisualizer({ active }: { active: boolean }) {
  return (
    <div className="glass flex items-center rounded-xl px-3 py-2">
      <div className="flex h-10 items-end gap-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-accent/85 via-indigo-300/80 to-mint/90 transition-all duration-300"
            style={{ height: active ? `${8 + ((i * 11) % 26)}px` : "6px", opacity: active ? 1 : 0.3 }}
          />
        ))}
      </div>
      <div className="ml-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Audio pulse</p>
        <p className="text-xs text-white/60">{active ? "Live voice activity detected" : "Waiting for voice input"}</p>
      </div>
    </div>
  );
}
