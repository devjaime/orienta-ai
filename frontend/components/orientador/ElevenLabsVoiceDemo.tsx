"use client";

import { useEffect, useState } from "react";
import { AudioLines, Loader2, PhoneOff } from "lucide-react";

type DemoStatus = "idle" | "connecting" | "speaking";

interface ElevenLabsVoiceDemoProps {
  disabled?: boolean;
  onStartDemo: (prompt: string) => Promise<void>;
}

const DEMO_PROMPT =
  "Actua como Valeria en modo demo de voz. Saluda brevemente e inicia un cuestionario vocacional por voz con una pregunta simple sobre intereses, actividades favoritas y forma de aprender.";

const DEMO_AUDIO_TEXT =
  "Hola, soy Valeria. Iniciemos un cuestionario vocacional por voz. Primera pregunta: que actividades disfrutas tanto que pierdes la nocion del tiempo?";

export default function ElevenLabsVoiceDemo({
  disabled = false,
  onStartDemo,
}: ElevenLabsVoiceDemoProps) {
  const [status, setStatus] = useState<DemoStatus>("idle");

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakDemo = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(DEMO_AUDIO_TEXT);
    utterance.lang = "es-CL";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
  };

  const handleStartDemo = async () => {
    if (disabled || status !== "idle") return;

    setStatus("connecting");
    window.setTimeout(() => {
      setStatus("speaking");
      speakDemo();
    }, 650);

    await onStartDemo(DEMO_PROMPT);
  };

  const handleStop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStatus("idle");
  };

  const isActive = status !== "idle";

  return (
    <section className="relative overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-bold tracking-normal text-vocari-text">
            Valeria Voz
          </p>
          <p className="mt-1 text-xs text-vocari-text-muted">
            Cuestionario vocacional por voz en modo demo.
          </p>
        </div>
        <span className="rounded-full border border-vocari-primary/20 bg-vocari-primary/5 px-2.5 py-1 text-xs font-medium text-vocari-primary">
          Demo voz
        </span>
      </div>

      <div className="relative mx-auto mt-5 flex h-64 w-full max-w-sm items-center justify-center">
        <div
          className={`absolute h-56 w-56 rounded-full opacity-90 blur-[0.5px] transition-transform duration-700 ${
            isActive ? "animate-spin" : ""
          }`}
          style={{
            animationDuration: "7s",
            background:
              "conic-gradient(from 15deg, #ffffff 0deg, #bcefee 38deg, #2d5fc4 74deg, #4a8bc7 110deg, #a8eeee 150deg, #ffffff 190deg, #72c8d0 235deg, #2258bd 292deg, #b8eff0 330deg, #ffffff 360deg)",
          }}
        />
        <div className="absolute h-48 w-48 rounded-full bg-cyan-100/30 blur-xl" />
        <button
          type="button"
          onClick={isActive ? handleStop : handleStartDemo}
          disabled={disabled}
          className="relative z-10 inline-flex h-14 items-center gap-3 rounded-full bg-white/90 px-4 pr-6 text-base font-semibold text-gray-950 shadow-lg ring-1 ring-gray-200 transition hover:scale-[1.02] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={isActive ? "Detener demo de agente de voz" : "Iniciar demo de agente de voz"}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-950 text-white">
            {status === "connecting" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isActive ? (
              <PhoneOff className="h-5 w-5" />
            ) : (
              <AudioLines className="h-5 w-5" />
            )}
          </span>
          {status === "connecting"
            ? "Conectando..."
            : isActive
              ? "Finalizar demo"
              : "Call AI agent"}
        </button>
      </div>

      <p className="text-center text-sm text-vocari-text-muted">
        Simulacion local: Valeria pregunta, el estudiante responde y Vocari interpreta el perfil.
      </p>
    </section>
  );
}
