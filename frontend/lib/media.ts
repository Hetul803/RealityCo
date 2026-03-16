export async function getUserMediaStream(audio = true, video = true): Promise<MediaStream> {
  try {
    console.log("Requesting media access...", { audio, video });
    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "environment"
      }
    });
    console.log("Media access granted:", stream);
    return stream;
  } catch (error) {
    console.error("Media access error:", error);
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error("Camera/microphone permission denied. Please allow access in browser settings.");
      } else if (error.name === 'NotFoundError') {
        throw new Error("No camera/microphone found. Please connect devices.");
      } else if (error.name === 'NotReadableError') {
        throw new Error("Camera/microphone is already in use by another application.");
      } else if (error.name === 'OverconstrainedError') {
        throw new Error("Camera constraints not supported. Try using default settings.");
      } else {
        throw new Error(`Camera access failed: ${error.message}`);
      }
    }
    throw error;
  }
}

export function captureFrame(video: HTMLVideoElement, width = 1024): string {
  const scale = width / video.videoWidth;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.floor(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82).replace("data:image/jpeg;base64,", "");
}

export function speakText(text: string): void {
  window.speechSynthesis.cancel();
  
  // Clean up text for better speech
  const cleanText = text
    .replace(/\+/g, "plus")
    .replace(/\*/g, "times")
    .replace(/\//g, "divided by")
    .replace(/\=/g, "equals")
    .replace(/\-/g, "minus")
    .replace(/\./g, ". ")
    .replace(/\s+/g, " ")
    .trim();
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // More natural voice settings
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1.0; // Natural pitch
  utterance.volume = 0.9; // Slightly lower volume
  utterance.lang = "en-US";
  
  // Try to get a better voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.name.includes("Samantha") || 
    voice.name.includes("Karen") ||
    voice.name.includes("Alex") ||
    voice.name.includes("Daniel")
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  // Add slight pauses at punctuation
  utterance.onboundary = (event) => {
    if (event.name === 'sentence') {
      // Small pause between sentences
      utterance.rate = 0.85;
    }
  };
  
  window.speechSynthesis.speak(utterance);
}
