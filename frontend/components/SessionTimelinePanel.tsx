import { Clock3 } from "lucide-react";

export interface TimelineEntry {
  id: string;
  timestamp: string;
  text: string;
}

export function SessionTimelinePanel({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/78">Session timeline</h3>
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">Recent events</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-white/45">Events will appear after your first analysis.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
              <p className="flex items-center gap-2 text-white/80">
                <Clock3 className="h-3.5 w-3.5 text-white/45" /> {entry.text}
              </p>
              <p className="mt-1 text-xs text-white/45">{entry.timestamp}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
