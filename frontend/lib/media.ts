export async function getUserMediaStream(audio = true, video = true): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio,
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "environment"
    }
  });
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
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}
