"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Send, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

/* ---------- Types ---------- */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  reply: string;
  model_used: string;
}

/* ---------- Constants ---------- */

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hola! Soy Valeria, tu orientadora vocacional. Estoy aqui para ayudarte a explorar tus opciones de carrera y entender mejor tu perfil vocacional. Por donde quieres comenzar?",
  timestamp: new Date(),
};

const SUGGESTED_QUESTIONS = [
  "Que significa mi codigo Holland?",
  "Que carreras se recomiendan para mi perfil?",
  "Como puedo explorar mis vocaciones?",
  "Que debo considerar al elegir una carrera?",
];

/* ---------- Sub-components ---------- */

function ValeriaAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-full bg-vocari-primary flex items-center justify-center text-white font-bold shrink-0`}
    >
      V
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <ValeriaAvatar />
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          <span className="block h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="block h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="block h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex flex-col items-end mb-3">
        <div className="bg-vocari-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%] shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-vocari-text-muted mt-1 mr-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-3">
      <ValeriaAvatar />
      <div className="flex flex-col">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[75%] shadow-sm">
          <p className="text-sm leading-relaxed text-vocari-text whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <span className="text-xs text-vocari-text-muted mt-1 ml-1">
          Valeria &middot; {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */

function OrientadorVirtualContent() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setHasUserSentMessage(true);

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      // Build messages array for API (exclude welcome, last 10 messages)
      const contextMessages = [...messages, userMessage]
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await api.post<ChatResponse>("/api/v1/chat/orientador", {
          messages: contextMessages,
          student_context: true,
        });

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Lo siento, tuve un problema para procesar tu mensaje. Por favor intenta de nuevo en un momento.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, isLoading],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4 shrink-0">
        <div className="h-11 w-11 rounded-full bg-vocari-primary flex items-center justify-center text-white font-bold text-lg">
          V
        </div>
        <div>
          <h1 className="text-lg font-bold text-vocari-text">Valeria</h1>
          <p className="text-xs text-vocari-text-muted">Orientadora Vocacional Virtual</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-600 font-medium">En linea</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <LoadingDots />}

        {/* Suggested questions - shown before first user message */}
        {!hasUserSentMessage && !isLoading && (
          <div className="mt-4 mb-2">
            <p className="text-xs text-vocari-text-muted mb-2 ml-11">
              Preguntas sugeridas:
            </p>
            <div className="flex flex-col gap-2 ml-11">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm text-vocari-primary border border-vocari-primary/30 rounded-xl px-3 py-2 hover:bg-vocari-primary/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mx-1 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 pt-3 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje... (Enter para enviar)"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-vocari-text placeholder-vocari-text-muted focus:outline-none focus:ring-2 focus:ring-vocari-primary/40 focus:border-vocari-primary disabled:opacity-60 max-h-32 overflow-y-auto"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 rounded-xl bg-vocari-primary text-white flex items-center justify-center hover:bg-vocari-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-vocari-text-muted mt-1.5 text-center">
          Valeria es una asistente virtual. Sus respuestas son orientativas.
        </p>
      </div>
    </div>
  );
}

export default function OrientadorVirtualPage() {
  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <OrientadorVirtualContent />
    </RoleGuard>
  );
}
