"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "@/components/games/GamePlayer";
import { Button } from "@/components/ui";
import { CheckCircle } from "lucide-react";

interface Pattern {
  shapes: string[];
  missingIndex: number;
  options: string[];
  correct: number;
}

const SHAPES = ["●", "■", "▲", "◆", "★", "●"];

function generatePattern(): Pattern {
  const shapeCount = 9;
  const missingIndex = Math.floor(Math.random() * shapeCount);
  
  const missingShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  
  const shapes: string[] = [];
  for (let i = 0; i < shapeCount; i++) {
    if (i === missingIndex) {
      shapes.push("?");
    } else {
      const shapeIndex = (i + missingIndex) % SHAPES.length;
      shapes.push(SHAPES[shapeIndex]);
    }
  }

  const correctShape = missingShape;
  const options = [correctShape];
  
  while (options.length < 4) {
    const option = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    if (!options.includes(option)) {
      options.push(option);
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    shapes,
    missingIndex,
    options,
    correct: options.indexOf(correctShape),
  };
}

export function PatternRecognition() {
  const { metrics, updateMetrics, endGame } = useGame();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(15);
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const [currentPattern, setCurrentPattern] = useState<Pattern>(() => generatePattern());

  const loadNewPattern = useCallback(() => {
    const pattern = generatePattern();
    setCurrentPattern(pattern);
    setSelectedAnswer(null);
    setShowResult(false);
    setStartTime(Date.now());
  }, []);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (!currentPattern || showResult) return;

    const reactionTime = Date.now() - startTime;
    setReactionTimes([...reactionTimes, reactionTime]);
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === currentPattern.correct;
    
    if (isCorrect) {
      const timeBonus = Math.max(0, 10000 - reactionTime) / 100;
      updateMetrics({
        score: metrics.score + Math.round(50 + timeBonus),
      });
    } else {
      updateMetrics({
        errors: metrics.errors + 1,
      });
    }
  }, [currentPattern, showResult, startTime, reactionTimes, metrics.score, metrics.errors, updateMetrics]);

  const handleNext = useCallback(() => {
    if (round >= totalRounds) {
      const avgReactionTime = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;
      
      updateMetrics({
        extra: {
          avg_reaction_time: avgReactionTime,
          patterns_completed: round,
        },
      });
      setIsComplete(true);
      return;
    }
    
    setRound(round + 1);
    loadNewPattern();
  }, [round, totalRounds, reactionTimes, updateMetrics, loadNewPattern]);

  useEffect(() => {
    if (isComplete) {
      endGame();
    }
  }, [isComplete, endGame]);

  if (isComplete) {
    const avgReaction = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 100)
      : 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-vocari-text mb-2">
          Juego Completado!
        </h2>
        <p className="text-lg text-vocari-text-muted mb-4">
          Tu puntaje final: <span className="font-bold text-vocari-accent">{metrics.score}</span>
        </p>
        <div className="text-sm text-vocari-text-muted space-y-1">
          <p>Patrones completados: {round}</p>
          <p>Errores: {metrics.errors}</p>
          <p>Tiempo promedio de reaccion: {avgReaction}s</p>
        </div>
      </div>
    );
  }

  if (!currentPattern) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-vocari-text-muted">
          Ronda {round} de {totalRounds}
        </span>
        <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all"
            style={{ width: `${(round / totalRounds) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <p className="text-center text-vocari-text-muted mb-6">
          Encuentra el patron y selecciona la figura que falta
        </p>

        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
          {currentPattern.shapes.map((shape, index) => (
            <div
              key={index}
              className="h-16 flex items-center justify-center text-4xl bg-gray-50 rounded-lg"
            >
              {shape}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          {currentPattern.options.map((option, index) => {
            let buttonClass = "w-16 h-16 text-3xl rounded-lg border-2 transition-colors ";
            
            if (showResult) {
              if (index === currentPattern.correct) {
                buttonClass += "border-green-500 bg-green-50 ";
              } else if (index === selectedAnswer) {
                buttonClass += "border-red-500 bg-red-50 ";
              } else {
                buttonClass += "border-gray-200 ";
              }
            } else {
              buttonClass += "border-gray-200 hover:border-purple-500 bg-white ";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={buttonClass}
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
            {round >= totalRounds ? "Ver Resultados" : "Siguiente"}
          </Button>
        </div>
      )}
    </div>
  );
}
