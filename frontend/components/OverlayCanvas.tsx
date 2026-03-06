"use client";

import { Annotation } from "@/lib/contracts";

export function OverlayCanvas({ annotations }: { annotations: Annotation[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {annotations.map((a, idx) => {
        const labelBelow = a.y < 0.08;
        const safeWidth = Math.max(a.width, 0.08);
        const safeHeight = Math.max(a.height, 0.06);

        return (
          <div
            key={`${a.label}-${idx}`}
            className="absolute rounded-lg border-2 border-mint/90 bg-mint/10 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_20px_rgba(110,231,215,0.25)]"
            style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, width: `${safeWidth * 100}%`, height: `${safeHeight * 100}%` }}
          >
            <span
              className={`absolute left-0 max-w-[160px] truncate rounded-md border border-white/20 bg-black/75 px-2 py-1 text-[10px] font-medium tracking-wide text-white ${
                labelBelow ? "top-0 translate-y-1" : "-top-1 -translate-y-full"
              }`}
              title={a.note ? `${a.label}: ${a.note}` : a.label}
            >
              {a.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
