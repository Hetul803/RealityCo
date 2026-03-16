import { BadgeCheck, Gauge, ListChecks, Sparkles } from "lucide-react";

import { AnalysisResponse } from "@/lib/contracts";

export function SceneInsightsPanel({
  insight,
  mode,
  livePaceHint,
  liveFillerHint
}: {
  insight: AnalysisResponse | null;
  mode: "visual_guide" | "interview_coach";
  livePaceHint?: string;
  liveFillerHint?: string;
}) {
  const isCoach = mode === "interview_coach";

  return (
    <div className="glass min-h-[16rem] rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/78">{isCoach ? "Interview coaching" : "Scene insights"}</h3>
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">{isCoach ? "Transcript-first" : "Grounded vision"}</span>
      </div>

      {isCoach && (livePaceHint || liveFillerHint) ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {liveFillerHint ? <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/70">{liveFillerHint}</div> : null}
          {livePaceHint ? <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/70">{livePaceHint}</div> : null}
        </div>
      ) : null}

      {!insight ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-sm text-white/52">
          {isCoach ? (
            <>
              No coaching yet.
              <div className="mt-2 text-white/70">Choose a question (optional), answer out loud, then click <span className="text-white">Coach My Answer</span>.</div>
            </>
          ) : (
            <>
              No frame analysis yet.
              <div className="mt-2 text-white/70">Use <span className="text-white">Analyze frame</span> or <span className="text-white">Freeze frame</span> for precise explanation and overlays.</div>
            </>
          )}
        </div>
      ) : insight.mode === "interview_coach" ? (
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/45"><Sparkles className="h-3.5 w-3.5" /> Summary</p>
            <p className="mt-1 leading-relaxed text-white/90">{insight.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-emerald-400/10 p-3">
              <p className="text-xs uppercase tracking-wide text-emerald-300">Strengths</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-white/85">
                {insight.strengths.slice(0, 3).map((s, idx) => (
                  <li key={`${s}-${idx}`}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-amber-300/10 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-300">Improvements</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-white/85">
                {insight.weaknesses.slice(0, 3).map((w, idx) => (
                  <li key={`${w}-${idx}`}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/45"><ListChecks className="h-3.5 w-3.5" /> Structure & Example</p>
            <p className="mt-1 text-white/85">{insight.structure_feedback.note}</p>
            <p className="mt-1 text-white/70">{insight.example_feedback.note}</p>
          </div>

          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/45"><Gauge className="h-3.5 w-3.5" /> Pace + Filler Estimate</p>
            <p className="mt-1 text-white/85">{insight.pacing_hint}</p>
            <p className="mt-1 text-white/70">
              Estimated fillers: <span className="text-white">{insight.filler_word_count.estimate}</span> · {insight.filler_word_count.note}
            </p>
          </div>

          <div className="rounded-xl border border-accent/35 bg-accent/10 p-3">
            <p className="text-xs uppercase tracking-wide text-accent">Improved answer</p>
            <p className="mt-1 whitespace-pre-wrap text-white/90">{insight.improved_answer}</p>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
            <p className="text-xs text-white/70">Communication quality score</p>
            <p className="text-sm font-semibold text-white">
              {insight.overall_score.value}/{insight.overall_score.scale}
            </p>
          </div>
          <p className="text-xs text-white/55">{insight.overall_score.rubric_note}</p>
          <p className="rounded-lg bg-white/[0.02] p-2 text-xs text-white/60">
            <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Confidence note:</span> {insight.confidence_note}
          </p>
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
