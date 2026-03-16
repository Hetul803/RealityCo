import { Clock3, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface TimelineEntry {
  id: string;
  timestamp: string;
  text: string;
}

export function SessionTimelinePanel({ entries }: { entries: TimelineEntry[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass rounded-2xl p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-3 flex w-full items-center justify-between text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
      >
        <h3 className="text-sm font-medium text-white/78">Session timeline</h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            {entries.length} events
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/60" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="space-y-2">
          {entries.length === 0 ? (
            <p className="text-sm text-white/45">Events will appear after your first analysis.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-48 overflow-auto">
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
      )}
    </div>
  );
}
