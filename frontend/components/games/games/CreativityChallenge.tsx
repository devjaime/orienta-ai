"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/components/games/GamePlayer";
import { Button, Input, Textarea } from "@/components/ui";
import { CheckCircle, Lightbulb, Send } from "lucide-react";

interface Prompt {
  id: number;
  question: string;
  hint: string;
}

const PROMPTS: Prompt[] = [
  {
    id: 1,
    question: "Si pudieras inventar una profesion que no existe, cual seria y que problemas resolveria?",
    hint: "Piensa en problemas actuales que nadie esta resolviendo",
  },
  {
    id: 2,
    question: "Describe como seria un dia perfecto en tu trabajo ideal dentro de 10 anos",
    hint: "Incluye actividades, personas, lugar y como te sientes",
  },
  {
    id: 3,
    question: "Si tuvieras $1 millon para resolver un problema mundial, cual eligiras y como lo atacarias?",
    hint: "Piensa en algo que genere gran impacto positivo",
  },
  {
    id: 4,
    question: "Que habilidad te gustaria desarrollar instantaneamente y como la usarias?",
    hint: "Puede ser cualquier habilidad, sin limites",
  },
  {
    id: 5,
    question: "Diseña una solucion inovadora para ayudar a estudiantes de tu edad",
    hint: "Piensa en dificultades que enfrentas quotidianamente",
  },
];

export function CreativityChallenge() {
  const { metrics, updateMetrics, endGame } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const prompt = PROMPTS[currentIndex];

  const calculateOriginality = (responses: string[]): number => {
    const avgLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length;
    const uniqueWords = new Set(responses.flatMap((r) => r.toLowerCase().split(" ")));
    const diversityScore = uniqueWords.size / responses.join(" ").split(" ").length;
    
    return Math.min(100, Math.round(avgLength / 10 + diversityScore * 50));
  };

  const handleSubmit = useCallback(() => {
    if (!currentResponse.trim()) return;

    const newResponses = [...responses, currentResponse];
    setResponses(newResponses);
    setSubmitted(true);
    setSubmitted(true);

    const baseScore = currentResponse.length > 50 ? 80 : 40;
    updateMetrics({
      score: metrics.score + baseScore,
    });
  }, [currentResponse, responses, metrics.score, updateMetrics]);

  const handleNext = useCallback(() => {
    if (currentIndex >= PROMPTS.length - 1) {
      const originalityScore = calculateOriginality(responses);
      const diversityScore = Math.min(100, Math.round((responses.length / PROMPTS.length) * 100));
      
      updateMetrics({
        extra: {
          originality_score: originalityScore,
          diversity_score: diversityScore,
          novelty_score: Math.round((originalityScore + diversityScore) / 2),
        },
      });
      setIsComplete(true);
      return;
    }
    
    setCurrentIndex(currentIndex + 1);
    setCurrentResponse("");
    setSubmitted(false);
  }, [currentIndex, responses, updateMetrics]);

  useEffect(() => {
    if (isComplete) {
      endGame();
    }
  }, [isComplete, endGame]);

  if (isComplete) {
    const originality = Number(metrics.extra?.originality_score || 0);
    const diversity = Number(metrics.extra?.diversity_score || 0);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-vocari-text mb-2">
          Juego Completado!
        </h2>
        <p className="text-lg text-vocari-text-muted mb-4">
          Tu puntaje final: <span className="font-bold text-vocari-accent">{metrics.score}</span>
        </p>
        
        <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="p-4 bg-pink-50 rounded-lg">
            <Lightbulb className="h-6 w-6 text-pink-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Originalidad</p>
            <p className="text-2xl font-bold text-pink-700">{originality}%</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <Lightbulb className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Diversidad</p>
            <p className="text-2xl font-bold text-purple-700">{diversity}%</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-vocari-text-muted">
          Has completado {responses.length} de {PROMPTS.length} desafios creativos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-vocari-text-muted">
          Desafio {currentIndex + 1} de {PROMPTS.length}
        </span>
        <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-pink-500 transition-all"
            style={{ width: `${((currentIndex + 1) / PROMPTS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Lightbulb className="h-6 w-6 text-pink-600" />
          </div>
          <h3 className="text-xl font-bold text-vocari-text">
            Desafio de Creatividad
          </h3>
        </div>
        
        <p className="text-lg text-vocari-text mb-2">{prompt.question}</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Pista:</strong> {prompt.hint}
          </p>
        </div>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">Respuesta enviada!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder="Escribe tu respuesta aqui... Se creativo!"
              className="min-h-[150px]"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!currentResponse.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Respuesta
            </Button>
          </div>
        )}
      </div>

      {submitted && (
        <div className="flex justify-center">
          <Button onClick={handleNext} size="lg">
            {currentIndex >= PROMPTS.length - 1 ? "Ver Resultados" : "Siguiente Desafio"}
          </Button>
        </div>
      )}
    </div>
  );
}
