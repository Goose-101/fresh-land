"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/types";

type Props = {
  language: string;
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  onAutoSubmit?: (text: string) => void;
};

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function VoiceInput({ language, onTranscript, onInterim, onAutoSubmit }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalRef = useRef<string>("");

  useEffect(() => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) setSupported(false);
  }, []);

  const start = () => {
    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition) as any;
    if (!SR) return;
    const rec = new SR();
    const speechCode = LANGUAGES.find((l) => l.code === language)?.speechCode || "en-US";
    rec.lang = speechCode;
    rec.interimResults = true;
    rec.continuous = true;
    finalRef.current = "";

    rec.onresult = (e: any) => {
      let interim = "";
      let final = finalRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      finalRef.current = final;
      onTranscript(final + interim);
      onInterim?.(final + interim);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        rec.stop();
        const text = finalRef.current.trim();
        if (text) onAutoSubmit?.(text);
      }, 2000);
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input not supported in your browser"
        className="p-2 rounded-full text-text-muted bg-slate-100 cursor-not-allowed"
      >
        <MicOff className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      aria-label={listening ? "Stop listening" : "Start voice input"}
      className={cn(
        "p-2 rounded-full transition",
        listening
          ? "bg-red-500 text-white animate-pulse-dot"
          : "bg-primary-light text-primary hover:bg-primary hover:text-white"
      )}
    >
      <Mic className="h-4 w-4" />
    </button>
  );
}
