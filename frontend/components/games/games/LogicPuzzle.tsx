"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/components/games/GamePlayer";
import { Button } from "@/components/ui";
import { CheckCircle, XCircle, ArrowRight, RefreshCw } from "lucide-react";

interface Puzzle {
  id: number;
  pattern: string;
  options: string[];
  correct: number;
}

const PUZZLES: Puzzle[] = [
  { id: 1, pattern: "2, 4, 8, 16, ?", options: ["24", "32", "28", "20"], correct: 1 },
  { id: 2, pattern: "1, 1, 2, 3, 5, ?", options: ["6", "7", "8", "9"], correct: 2 },
  { id: 3, pattern: "1, 4, 9, 16, ?", options: ["25", "20", "24", "27"], correct: 0 },
  { id: 4, pattern: "3, 6, 12, 24, ?", options: ["36", "48", "42", "30"], correct: 1 },
  { id: 5, pattern: "5, 10, 20, 40, ?", options: ["60", "70", "80", "50"], correct: 2 },
  { id: 6, pattern: "1, 3, 6, 10, ?", options: ["14", "15", "16", "13"], correct: 1 },
  { id: 7, pattern: "2, 6, 12, 20, ?", options: ["28", "30", "32", "26"], correct: 1 },
  { id: 8, pattern: "1, 2, 6, 24, ?", options: ["48", "72", "96", "120"], correct: 3 },
  { id: 9, pattern: "10, 8, 6, 4, ?", options: ["0", "1", "2", "3"], correct: 2 },
  { id: 10, pattern: "A, C, E, G, ?", options: ["H", "I", "J", "F"], correct: 1 },
];

export function LogicPuzzle() {
  const { metrics, updateMetrics, endGame } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const puzzle = PUZZLES[currentIndex];

  const handleAnswer = useCallback((answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === puzzle.correct;
    
    if (isCorrect) {
      updateMetrics({
        score: metrics.score + 100,
      });
    } else {
      updateMetrics({
        errors: metrics.errors + 1,
      });
    }
  }, [puzzle.correct, showResult, metrics.score, metrics.errors, updateMetrics]);

  const handleNext = useCallback(() => {
    if (currentIndex >= PUZZLES.length - 1) {
      setIsComplete(true);
      return;
    }
    
    setCurrentIndex(currentIndex + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentIndex]);

  useEffect(() => {
    if (isComplete) {
      endGame();
    }
  }, [isComplete, endGame]);

  if (isComplete) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-vocari-text mb-2">
          Juego Completado!
        </h2>
        <p className="text-lg text-vocari-text-muted mb-4">
          Tu puntaje final: <span className="font-bold text-vocari-accent">{metrics.score}</span>
        </p>
        <p className="text-sm text-vocari-text-muted">
          Errores: {metrics.errors} | Tiempo: {Math.floor(metrics.time_seconds / 60)}:{String(metrics.time_seconds % 60).padStart(2, "0")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-vocari-text-muted">
          Pregunta {currentIndex + 1} de {PUZZLES.length}
        </span>
        <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-vocari-primary transition-all"
            style={{ width: `${((currentIndex + 1) / PUZZLES.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-3xl font-mono font-bold text-vocari-text mb-8">
          {puzzle.pattern}
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {puzzle.options.map((option, index) => {
            let buttonClass = "border-2 ";
            
            if (showResult) {
              if (index === puzzle.correct) {
                buttonClass += "border-green-500 bg-green-50 ";
              } else if (index === selectedAnswer) {
                buttonClass += "border-red-500 bg-red-50 ";
              } else {
                buttonClass += "border-gray-200 ";
              }
            } else {
              buttonClass += "border-gray-200 hover:border-vocari-accent ";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`p-4 rounded-lg text-xl font-mono font-bold transition-colors ${buttonClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <div className="flex justify-center">
          <Button onClick={handleNext} size="lg">
            {currentIndex >= PUZZLES.length - 1 ? "Ver Resultados" : "Siguiente"} 
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
