"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  riasecQuestions,
  scaleLabels,
  dimensionDescriptions,
} from "@/lib/data/riasec-questions";
import { calcularCodigoRIASEC } from "@/lib/data/riasec-scoring";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils/validation";
import { RIASEC_COLORS } from "@/lib/utils/constants";
import type { RIASECScores, RIASECDimension } from "@/lib/types/career";

export interface RIASECTestResult {
  codigo_holland: string;
  certeza: "Alta" | "Media" | "Exploratoria";
  puntajes: RIASECScores;
  ranking: Array<{
    dimension: RIASECDimension;
    score: number;
    intensity: number;
    rejection: number;
  }>;
  top_dimensions: RIASECDimension[];
  respuestas: Record<number, number>;
  duracion_minutos: number;
}

interface RIASECTestProps {
  onComplete: (result: RIASECTestResult) => void;
}

export function RIASECTest({ onComplete }: RIASECTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [startTime] = useState(Date.now());

  const question = riasecQuestions[currentQuestion];
  const totalQuestions = riasecQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(responses).length;
  const currentDimDesc = dimensionDescriptions[question.dimension];

  const handleResponse = useCallback(
    (value: number) => {
      setResponses((prev) => ({
        ...prev,
        [question.id]: value,
      }));
    },
    [question.id],
  );

  const handleNext = useCallback(() => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }, [currentQuestion, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const handleSubmit = useCallback(() => {
    if (answeredCount < totalQuestions) return;

    const resultado = calcularCodigoRIASEC(responses);
    const duracion = Math.round((Date.now() - startTime) / 60000);

    onComplete({
      ...resultado,
      respuestas: responses,
      duracion_minutos: Math.max(1, duracion),
    });
  }, [answeredCount, totalQuestions, responses, startTime, onComplete]);

  const isCurrentAnswered = responses[question.id] !== undefined;
  const allAnswered = answeredCount >= totalQuestions;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Encabezado con progreso */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-vocari-text">
              Test Vocacional RIASEC
            </h1>
            <p className="text-sm text-vocari-text-muted">
              Pregunta {currentQuestion + 1} de {totalQuestions}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm text-vocari-text-muted">
              {answeredCount} respondidas
            </span>
          </div>
        </div>
        <ProgressBar
          value={progress}
          showLabel={false}
          color="bg-vocari-primary"
        />
      </div>

      {/* Pregunta */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm"
        >
          {/* Badge de dimension */}
          <div className="mb-4 flex items-center gap-2">
            <span
              className="inline-block w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center"
              style={{
                backgroundColor: RIASEC_COLORS[question.dimension],
              }}
            >
              {question.dimension}
            </span>
            <span className="text-sm text-vocari-text-muted">
              {currentDimDesc.nombre}
            </span>
          </div>

          {/* Texto de la pregunta */}
          <h2 className="text-xl md:text-2xl font-bold text-vocari-text mb-8">
            {question.text}
          </h2>

          {/* Opciones Likert */}
          <div className="space-y-3">
            {([1, 2, 3, 4, 5] as const).map((value) => {
              const isSelected = responses[question.id] === value;
              return (
                <motion.button
                  key={value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleResponse(value)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all text-left",
                    isSelected
                      ? "border-vocari-primary bg-vocari-primary/10 text-vocari-text"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-400",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          isSelected
                            ? "border-vocari-primary bg-vocari-primary"
                            : "border-gray-400",
                        )}
                      >
                        {isSelected && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <span className="font-medium">{scaleLabels[value]}</span>
                    </div>
                    <span className="text-xl font-bold text-vocari-text-muted">
                      {value}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navegacion */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="gap-2"
        >
          <ChevronLeft size={20} />
          Anterior
        </Button>

        {isLastQuestion ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="gap-2"
          >
            Ver Resultados
            <Check size={20} />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!isCurrentAnswered}
            className="gap-2"
          >
            Siguiente
            <ChevronRight size={20} />
          </Button>
        )}
      </div>

      {/* Indicador de preguntas sin responder (solo en la ultima) */}
      {isLastQuestion && !allAnswered && (
        <p className="text-center text-sm text-warning mt-4">
          Faltan {totalQuestions - answeredCount} preguntas por responder.
          Debes completar todas para ver tus resultados.
        </p>
      )}
    </div>
  );
}
