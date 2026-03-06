import { VisionAnalysisResponse } from "@/lib/contracts";

export function SceneInsightsPanel({ insight }: { insight: VisionAnalysisResponse | null }) {
  return (
    <div className="glass min-h-[16rem] rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/78">Scene insights</h3>
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">Grounded vision</span>
      </div>
      {!insight ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-sm text-white/52">
          No frame analysis yet.
          <div className="mt-2 text-white/70">Use <span className="text-white">Analyze current frame</span> or <span className="text-white">Freeze frame</span> for precise explanation and overlays.</div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="leading-relaxed text-white/90">{insight.summary_text}</p>
          <p className="rounded-xl bg-white/[0.03] p-3 text-white/65">{insight.scene_description}</p>
          {insight.uncertainty ? <p className="rounded-lg bg-amber-300/10 p-2 text-amber-300">Uncertainty: {insight.uncertainty}</p> : null}
          {insight.follow_up_suggestion ? <p className="rounded-lg bg-mint/10 p-2 text-mint">Try next: {insight.follow_up_suggestion}</p> : null}
        </div>
      )}
    </div>
  );
}
