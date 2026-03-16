import { AnalysisResponse, AppMode, SessionState } from "@/lib/contracts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Fallback URLs to try if main one fails
const FALLBACK_URLS = [
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
];

async function fetchWithFallback(url: string, init: RequestInit, timeoutMs = 18000): Promise<Response> {
  for (const baseUrl of FALLBACK_URLS) {
    try {
      const fallbackUrl = url.replace(API_BASE, baseUrl);
      console.log(`Trying fallback URL: ${fallbackUrl}`);
      const response = await fetchWithTimeout(fallbackUrl, init, timeoutMs);
      if (response.ok) {
        console.log(`Success with: ${baseUrl}`);
        return response;
      }
    } catch (error) {
      console.warn(`Failed with ${baseUrl}:`, error);
      continue;
    }
  }
  throw new Error(`All fallback URLs failed for ${url}`);
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = 18000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  console.log(`Fetching: ${input} with timeout ${timeoutMs}ms`);
  console.log("Request init:", init);
  
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    console.log(`Fetch success: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. The model may be slow right now.");
    }
    if (error instanceof TypeError) {
      throw new Error(`Network error: ${error.message}. Is the backend running at ${input}?`);
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

// Simple connectivity test
export async function testConnectivity(): Promise<boolean> {
  const testUrls = [
    "http://localhost:8000/api/health",
    "http://127.0.0.1:8000/api/health",
  ];
  
  for (const url of testUrls) {
    try {
      console.log("Testing connectivity to:", url);
      const response = await fetch(url);
      console.log(`Connectivity test ${url}: ${response.status}`);
      if (response.ok) {
        console.log("✅ Connectivity successful to:", url);
        return true;
      }
    } catch (error) {
      console.warn(`❌ Connectivity failed to ${url}:`, error);
    }
  }
  return false;
}

// Direct test to bypass any API issues
export async function directBackendTest(): Promise<string> {
  try {
    console.log("🧪 Direct backend test starting...");
    
    // Test 1: Simple health check
    console.log("Test 1: Health check");
    const healthResponse = await fetch("http://localhost:8000/api/health");
    console.log("Health response:", healthResponse.status, healthResponse.statusText);
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log("Health data:", healthData);
    
    // Test 2: Session creation
    console.log("Test 2: Session creation");
    const sessionResponse = await fetch("http://localhost:8000/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    console.log("Session response:", sessionResponse.status, sessionResponse.statusText);
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Session creation failed: ${sessionResponse.status} - ${errorText}`);
    }
    
    const sessionData = await sessionResponse.json();
    console.log("Session data:", sessionData);
    
    return `✅ Backend working! Session: ${sessionData.session_id}`;
  } catch (error) {
    console.error("❌ Direct backend test failed:", error);
    throw error;
  }
}

export async function createSession(): Promise<{ session_id: string; state: SessionState }> {
  const url = `${API_BASE}/api/sessions`;
  console.log("Creating session at:", url);
  console.log("Current page protocol:", window.location.protocol);
  console.log("Current page hostname:", window.location.hostname);
  console.log("API_BASE:", API_BASE);
  
  // Test connectivity first
  const canConnect = await testConnectivity();
  if (!canConnect) {
    throw new Error("Cannot connect to backend. Please check if the backend is running on port 8000.");
  }
  
  try {
    const res = await fetchWithFallback(url, { method: "POST" }, 12000);
    console.log("Session response status:", res.status);
    console.log("Session response headers:", Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Session error response:", errorText);
      throw new Error(await parseError(res, "Unable to create session"));
    }
    
    const data = await res.json();
    console.log("Session success:", data);
    return data;
  } catch (error) {
    console.error("Session creation failed:", error);
    throw error;
  }
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
  mode: AppMode;
  prompt: string;
  image_base64?: string;
  freeze_mode: boolean;
  recent_transcript: string[];
  selected_question?: string;
}): Promise<AnalysisResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/api/vision/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    26000
  );
  if (!res.ok) throw new Error(await parseError(res, "Analysis request failed"));
  return res.json();
}
