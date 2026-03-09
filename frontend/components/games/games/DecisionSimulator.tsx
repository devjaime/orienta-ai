"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/components/games/GamePlayer";
import { Button } from "@/components/ui";
import { CheckCircle, TrendingUp, TrendingDown, Scale } from "lucide-react";

interface Scenario {
  id: number;
  title: string;
  description: string;
  options: {
    label: string;
    description: string;
    type: "risk" | "safe" | "ethical" | "leadership";
    impact: number;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "El Proyecto Arriesgado",
    description: "Tu equipo propone un proyecto innovador pero con alto riesgo. El tiempo es limitado.",
    options: [
      { label: "Aprobar el proyecto", description: "Tomar el riesgo con potencial gran recompensa", type: "risk", impact: 80 },
      { label: "Mantener lo seguro", description: "Continuar con proyectos probados", type: "safe", impact: 40 },
      { label: "Buscar ms informacion", description: "Pedir ms datos antes de decidir", type: "ethical", impact: 60 },
    ],
  },
  {
    id: 2,
    title: "Conflicto en el Equipo",
    description: "Dos miembros de tu equipo tienen un conflicto que afecta el rendimiento.",
    options: [
      { label: "Mediar directamente", description: "Hablar con ambos y encontrar una solucion", type: "leadership", impact: 90 },
      { label: "Ignorar", description: "Dejar que resuelvan solos", type: "safe", impact: 20 },
      { label: "Escalar al manager", description: "Pasar el problema a superiores", type: "ethical", impact: 50 },
    ],
  },
  {
    id: 3,
    title: "Oportunidad de Crecimiento",
    description: "Te ofrecen una oportunidad de capacitacion que beneficiaria tu carrera.",
    options: [
      { label: "Aceptar inmediatamente", description: "Priorizar tu desarrollo profesional", type: "risk", impact: 85 },
      { label: "Consultar al equipo", description: "Verificar que no afecte al equipo", type: "leadership", impact: 70 },
      { label: "Declinar", description: "Mantener la estabilidad actual", type: "safe", impact: 30 },
    ],
  },
  {
    id: 4,
    title: "Recursos Limitados",
    description: "Tienes presupuesto para solo uno de dos proyectos importantes.",
    options: [
      { label: "Proyecto innovador", description: "Mayor potencial pero ms riesgoso", type: "risk", impact: 75 },
      { label: "Proyecto seguro", description: "Resultados garantizados pero menores", type: "safe", impact: 55 },
      { label: "Buscar consenso", description: "Consultar con stakeholders", type: "ethical", impact: 65 },
    ],
  },
  {
    id: 5,
    title: "Dato Sensible",
    description: "Descubriste un error en un informe que perjudica a un companero.",
    options: [
      { label: "Corregir inmediatamente", description: "Arreglar el error aunque sea incmodo", type: "ethical", impact: 95 },
      { label: "Ignorar", description: "No meterse en problemas", type: "safe", impact: 10 },
      { label: "Hablar en privado", description: "Discutirlo primero con la persona", type: "leadership", impact: 80 },
    ],
  },
  {
    id: 6,
    title: "Nueva Tecnologia",
    description: "Una nueva tecnologia podria mejorar procesos pero requiere capacitacion.",
    options: [
      { label: "Implementar ya", description: "Adoptar la tecnologia inmediatamente", type: "risk", impact: 70 },
      { label: "Capacitar primero", description: "Preparar al equipo antes", type: "leadership", impact: 85 },
      { label: "Mantener sistema actual", description: "No cambiar lo que funciona", type: "safe", impact: 40 },
    ],
  },
];

export function DecisionSimulator() {
  const { metrics, updateMetrics, endGame } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [decisionScores, setDecisionScores] = useState({
    risk: 0,
    safe: 0,
    ethical: 0,
    leadership: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  const scenario = SCENARIOS[currentIndex];

  const handleAnswer = useCallback((answerIndex: number) => {
    if (showResult) return;

    const option = scenario.options[answerIndex];
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    updateMetrics({
      score: metrics.score + option.impact,
    });

    setDecisionScores((prev) => ({
      ...prev,
      [option.type]: prev[option.type] + option.impact,
    }));
  }, [scenario.options, showResult, metrics.score, updateMetrics]);

  const handleNext = useCallback(() => {
    if (currentIndex >= SCENARIOS.length - 1) {
      updateMetrics({
        extra: {
          risk_score: decisionScores.risk,
          ethics_score: decisionScores.ethical,
          leadership_score: decisionScores.leadership,
        },
      });
      setIsComplete(true);
      return;
    }
    
    setCurrentIndex(currentIndex + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentIndex, decisionScores, updateMetrics]);

  useEffect(() => {
    if (isComplete) {
      endGame();
    }
  }, [isComplete, endGame]);

  if (isComplete) {
    const maxScore = Math.max(decisionScores.risk, decisionScores.safe, decisionScores.ethical, decisionScores.leadership);
    const dominantType = Object.entries(decisionScores).find(([, score]) => score === maxScore)?.[0] || "safe";

    const typeLabels: Record<string, string> = {
      risk: "Toma de Riesgos",
      safe: "Enfoque Conservador",
      ethical: "Juicio Etico",
      leadership: "Liderazgo",
    };

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
          <div className="p-4 bg-orange-50 rounded-lg">
            <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Toma de Riesgos</p>
            <p className="text-2xl font-bold text-orange-700">{decisionScores.risk}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <TrendingDown className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Conservador</p>
            <p className="text-2xl font-bold text-blue-700">{decisionScores.safe}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <Scale className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Etico</p>
            <p className="text-2xl font-bold text-green-700">{decisionScores.ethical}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Liderazgo</p>
            <p className="text-2xl font-bold text-purple-700">{decisionScores.leadership}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-vocari-text-muted">
          Tu perfil dominante: <strong>{typeLabels[dominantType]}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-vocari-text-muted">
          Escenario {currentIndex + 1} de {SCENARIOS.length}
        </span>
        <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${((currentIndex + 1) / SCENARIOS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-vocari-text mb-2">{scenario.title}</h3>
        <p className="text-vocari-text-muted mb-6">{scenario.description}</p>

        <div className="space-y-3">
          {scenario.options.map((option, index) => {
            let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-colors ";
            
            if (showResult) {
              if (index === selectedAnswer) {
                buttonClass += "border-orange-500 bg-orange-50 ";
              } else {
                buttonClass += "border-gray-100 ";
              }
            } else {
              buttonClass += "border-gray-200 hover:border-orange-400 ";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={buttonClass}
              >
                <p className="font-medium text-vocari-text">{option.label}</p>
                <p className="text-sm text-vocari-text-muted">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <div className="flex justify-center">
          <Button onClick={handleNext} size="lg">
            {currentIndex >= SCENARIOS.length - 1 ? "Ver Resultados" : "Siguiente Escenario"}
          </Button>
        </div>
      )}
    </div>
  );
}
