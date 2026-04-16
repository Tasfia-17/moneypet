/**
 * Voice input hook using Web Speech API.
 * Inspired by ElatoAI's audio pipeline concept, simplified for browser.
 */
"use client";
import { useState, useCallback, useRef } from "react";

export function useVoice(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, startListening, stopListening };
}

/** Speak text using browser TTS. */
export function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.1;
  utt.pitch = 1.3; // slightly higher = cuter
  window.speechSynthesis.speak(utt);
}
