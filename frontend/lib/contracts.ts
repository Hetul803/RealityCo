export type SessionState =
  | "idle"
  | "connecting"
  | "listening"
  | "user_speaking"
  | "analyzing_visual_context"
  | "thinking"
  | "agent_speaking"
  | "error";

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
  spoken_text: string;
  summary_text: string;
  scene_description: string;
  annotations: Annotation[];
  uncertainty?: string | null;
  follow_up_suggestion?: string | null;
}

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}
