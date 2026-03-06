import { SessionState, VisionAnalysisResponse } from "@/lib/contracts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = 18000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. The model may be slow right now.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function createSession(): Promise<{ session_id: string; state: SessionState }> {
  const res = await fetchWithTimeout(`${API_BASE}/api/sessions`, { method: "POST" }, 12000);
  if (!res.ok) throw new Error(await parseError(res, "Unable to create session"));
  return res.json();
}

export async function sendTranscript(sessionId: string, transcriptText: string): Promise<{ spoken_text: string }> {
  const res = await fetchWithTimeout(
    `${API_BASE}/api/audio/transcript`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, transcript_text: transcriptText })
    },
    16000
  );
  if (!res.ok) throw new Error(await parseError(res, "Transcript request failed"));
  return res.json();
}

export async function analyzeFrame(payload: {
  session_id: string;
  prompt: string;
  image_base64: string;
  freeze_mode: boolean;
  recent_transcript: string[];
}): Promise<VisionAnalysisResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/api/vision/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    26000
  );
  if (!res.ok) throw new Error(await parseError(res, "Frame analysis failed"));
  return res.json();
}
