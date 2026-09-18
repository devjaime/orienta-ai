"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft } from "lucide-react";
import {
  dimensionAccentStyles,
  dimensionBadgeStyles,
  dimensionNames,
  scaleOptions,
  testQuestions,
} from "./shared";

export function TestStep(p: {
  currentQuestion: number;
  handleAnswer: (v: number) => void;
  handlePreviousQuestion: () => void;
}) {
  const { currentQuestion, handleAnswer, handlePreviousQuestion } = p;
  const question = testQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / testQuestions.length) * 100;
  return (
      <div className="min-h-screen bg-gradient-to-br from-aura-primary/5 via-aura-surface to-aura-violet/5">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card className="mb-5">
            <CardContent className="pt-4">
              <div className="flex justify-between text-sm text-aura-muted mb-2">
                <span>Pregunta {currentQuestion + 1} de {testQuestions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <ProgressBar value={progress} className="h-2 mb-3" />
              <p className="text-xs text-aura-muted">
                Responde con honestidad. No hay respuestas correctas o incorrectas.
              </p>
            </CardContent>
          </Card>

          <Card className={`mb-6 border-2 ${dimensionAccentStyles[question.dimension]}`}>
            <CardContent className="pt-6">
              <Badge className={`mb-4 ${dimensionBadgeStyles[question.dimension]}`}>
                Dimension: {dimensionNames[question.dimension]}
              </Badge>
              <p className="text-xl md:text-2xl font-semibold text-aura-ink leading-relaxed">
                {question.text}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {scaleOptions.map((option) => (
              <Button
                key={option.value}
                variant="secondary"
                className="w-full text-left justify-start h-auto py-4 px-5 border-gray-300"
                onClick={() => handleAnswer(option.value)}
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-aura-primary text-white text-sm font-semibold mr-3">
                  {option.value}
                </span>
                <span>
                  <span className="block text-aura-ink font-medium">{option.label}</span>
                  <span className="block text-xs text-aura-muted">{option.helper}</span>
                </span>
              </Button>
            ))}
          </div>

          <div className="mt-6">
            <Button
              variant="ghost"
              className="px-0 text-aura-muted"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a la pregunta anterior
            </Button>
          </div>
        </div>
      </div>
    );
}
