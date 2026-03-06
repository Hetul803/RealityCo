"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T }
  ? T
  : typeof window extends { webkitSpeechRecognition: infer U }
    ? U
    : never;

export function useSpeechInput(onFinalText: (text: string) => void) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          onFinalText(result[0].transcript.trim());
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim.trim());
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, [onFinalText]);

  const start = useCallback(() => recognitionRef.current?.start(), []);
  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  return { isSupported, isListening, interimText, start, stop };
}
