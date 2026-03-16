export type SessionState =
  | "idle"
  | "connecting"
  | "listening"
  | "user_speaking"
  | "analyzing_visual_context"
  | "thinking"
  | "agent_speaking"
  | "error";

export type AppMode = "visual_guide" | "interview_coach";

export interface Annotation {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  note?: string | null;
  priority: number;
}

export interface VisionAnalysisResponse {
  mode: "visual_guide";
  spoken_text: string;
  summary_text: string;
  scene_description: string;
  annotations: Annotation[];
  uncertainty?: string | null;
  follow_up_suggestion?: string | null;
}

export interface InterviewCoachResponse {
  mode: "interview_coach";
  spoken_feedback: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  filler_word_count: {
    estimate: number;
    note: string;
  };
  pacing_hint: string;
  structure_feedback: {
    has_clear_structure: boolean;
    note: string;
  };
  example_feedback: {
    has_concrete_example: boolean;
    note: string;
  };
  improved_answer: string;
  overall_score: {
    value: number;
    scale: number;
    rubric_note: string;
  };
  confidence_note: string;
}

export type AnalysisResponse = VisionAnalysisResponse | InterviewCoachResponse;

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}
