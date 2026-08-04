"use client";

import { useState } from "react";
import ElevenLabsVoiceDemo from "@/components/orientador/ElevenLabsVoiceDemo";

interface DemoMessage {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: DemoMessage[] = [
  {
    role: "assistant",
    content:
      "Hola, soy Valeria. Esta vista muestra como se veria una integracion de voz tipo ElevenLabs dentro de Vocari.",
  },
];

export default function ElevenLabsDemoPage() {
  const [messages, setMessages] = useState<DemoMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartDemo = async (prompt: string) => {
    setIsLoading(true);
    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: "Iniciar llamada demo con agente de voz",
      },
    ]);

    await new Promise((resolve) => window.setTimeout(resolve, 900));

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content:
          "Demo activa: OpenRouter podria generar esta respuesta conversacional y ElevenLabs produciria la voz final. En este modo usamos audio del navegador para mostrar el flujo sin exponer claves ni consumir creditos.",
      },
      {
        role: "assistant",
        content: `Prompt demo enviado: ${prompt}`,
      },
    ]);
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <p className="text-sm font-medium text-vocari-primary">Vocari Labs</p>
          <h1 className="mt-1 text-2xl font-bold text-vocari-text">
            Demo de integracion de voz
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-vocari-text-muted">
            Prototipo visual para mostrar un agente conversacional estilo ElevenLabs.
            No requiere API key real mientras este en modo demo.
          </p>
        </div>

        <ElevenLabsVoiceDemo disabled={isLoading} onStartDemo={handleStartDemo} />

        <section className="mt-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-vocari-text">Transcripcion demo</h2>
          <div className="mt-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-vocari-primary text-white"
                      : "border border-gray-200 bg-gray-50 text-vocari-text"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <p className="text-sm text-vocari-text-muted">Generando respuesta demo...</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
