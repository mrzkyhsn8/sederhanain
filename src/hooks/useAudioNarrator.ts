import React, { useState, useEffect } from "react";
import { SederhanainData } from "../types";

/**
 * Custom hook to manage the Text-to-Speech (speechSynthesis) narration lifecycle.
 */
export function useAudioNarrator(
  data: SederhanainData | null,
  lang: "id" | "en",
  isLoading: boolean,
  setCurrentStepIdx: React.Dispatch<React.SetStateAction<number>>
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const speakStep = (stepIdx: number) => {
    if (!data) return;

    // 1. Cancel any active speech first
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);

    const l = data.langkah[stepIdx];
    if (!l) return;

    // 2. Build the spoken narrative text
    const stepLabel = lang === "en" ? "Step" : "Langkah";
    const textToSpeak = lang === "en"
      ? `${stepLabel} ${stepIdx + 1}, ${l.judul}. Imagine it like this: ${l.ibaratnya}. In the real world: ${l.kenyataannya}`
      : `${stepLabel} ${stepIdx + 1}, ${l.judul}. Ibarat cerita: ${l.ibaratnya}. Dan dalam kenyataan teknologinya: ${l.kenyataannya}`;

    // 3. Initialize utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // 4. Select optimized voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoices = voices.filter(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));

    let voice = null;
    if (matchingVoices.length > 0) {
      const microsoftOnline = matchingVoices.find(v =>
        v.name.toLowerCase().includes("microsoft") &&
        (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("online"))
      );
      const googleVoice = matchingVoices.find(v =>
        v.name.toLowerCase().includes("google")
      );
      const naturalVoice = matchingVoices.find(v =>
        v.name.toLowerCase().includes("natural")
      );
      const localVoice = matchingVoices.find(v => v.localService);

      voice = microsoftOnline || googleVoice || naturalVoice || localVoice || matchingVoices[0];
    }

    if (voice) {
      utterance.voice = voice;
    }

    // Speech speed optimization
    utterance.rate = lang === "id" ? 0.94 : 0.96;
    utterance.pitch = 1.0;

    // 5. Event bindings
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);

      // Auto advance functionality
      if (autoAdvance && stepIdx < data.langkah.length - 1) {
        setTimeout(() => {
          setCurrentStepIdx(prev => {
            const nextIdx = prev + 1;
            speakStep(nextIdx);
            return nextIdx;
          });
        }, 1500); // 1.5s buffer between steps
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    // 6. Speak
    window.speechSynthesis.speak(utterance);
    setCurrentUtterance(utterance);
  };

  const pauseSpeech = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeSpeech = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Stop speech if page is unloaded
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Stop speech if they trigger a new search or go back
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, [data, isLoading]);

  return {
    isPlaying,
    isPaused,
    autoAdvance,
    setAutoAdvance,
    speakStep,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  };
}
