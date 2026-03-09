"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/components/games/GamePlayer";
import { Button } from "@/components/ui";
import { CheckCircle, Users, MessageCircle, Handshake } from "lucide-react";

interface Scenario {
  id: number;
  title: string;
  description: string;
  situation: string;
  options: {
    label: string;
    description: string;
    type: "communication" | "collaboration" | "leadership" | "conflict";
    impact: number;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Reunion de Equipo",
    description: "Estas en una reunion donde nadie habla. Comorompes el hielo?",
    situation: "Es la primera reunion del proyecto y todos estan en silencio.",
    options: [
      { label: "Pedir opiniones", description: "Solicitar activamente la opinion de cada uno", type: "communication", impact: 90 },
      { label: "Compartir idea", description: "Comenzar compartiendo tu propia idea", type: "collaboration", impact: 75 },
      { label: "Asignar roles", description: "Asignar tareas especificas a cada persona", type: "leadership", impact: 80 },
    ],
  },
  {
    id: 2,
    title: "Opinion Diferente",
    description: "Un companero tiene una idea diferente a la tuya.",
    situation: "Tu companero propone una solucion que tu consideras ineficiente.",
    options: [
      { label: "Explicar tu perspectiva", description: "Dialogar respetuosamente sobre las opciones", type: "communication", impact: 95 },
      { label: "Probar su idea", description: "Dar una oportunidad a su enfoque", type: "collaboration", impact: 80 },
      { label: "Buscar tercera via", description: "Proponer una solucion compromise", type: "conflict", impact: 85 },
    ],
  },
  {
    id: 3,
    title: "Miembro Inactivo",
    description: "Hay un miembro del equipo que no participa.",
    situation: "Juan siempre llega tarde y no completa sus tareas.",
    options: [
      { label: "Hablar en privado", description: "Conversar personalmente con Juan", type: "conflict", impact: 90 },
      { label: "Asignar tarea especifica", description: "Darle una responsabilidad clara", type: "leadership", impact: 75 },
      { label: "Pedir ayuda al grupo", description: "Hacer que el equipo apoye a Juan", type: "collaboration", impact: 70 },
    ],
  },
  {
    id: 4,
    title: "Plazo Ajustado",
    description: "El proyecto tiene un plazo muy reducido.",
    situation: "Les quedan 2 dias para entregar pero falta mucho trabajo.",
    options: [
      { label: "Reorganizar", description: "Redistribuir tareas segun habilidades", type: "leadership", impact: 85 },
      { label: "Comunicar realidad", description: "Ser honesto sobre el tiempo necesario", type: "communication", impact: 80 },
      { label: "Trabajo extra", description: "Ofrecer trabajar horas adicionales", type: "collaboration", impact: 70 },
    ],
  },
  {
    id: 5,
    title: "Reconocimiento",
    description: "Quieres reconocer el trabajo de tu equipo.",
    situation: "El proyecto fue exitoso y quieres celebrar.",
    options: [
      { label: "Reconocimiento grupal", description: "Destacar los logros del equipo", type: "collaboration", impact: 90 },
      { label: "Mencionar individial", description: "Reconocer a cada persona por nombre", type: "leadership", impact: 85 },
      { label: "Solicitar feedback", description: "Pedir opiniones sobre la experiencia", type: "communication", impact: 75 },
    ],
  },
  {
    id: 6,
    title: "Conflicto Activo",
    description: "Dos companeros tienen un conflicto.",
    situation: "Maria y Pedro discuten constantemente por metodologias.",
    options: [
      { label: "Mediar", description: "Intervenir como mediador neutral", type: "conflict", impact: 95 },
      { label: "Ignorar", description: "Dejar que resuelvan solos", type: "collaboration", impact: 30 },
      { label: "Establecer reglas", description: "Crear normas claras de trabajo", type: "leadership", impact: 80 },
    ],
  },
];

export function TeamworkScenario() {
  const { metrics, updateMetrics, endGame } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scores, setScores] = useState({
    communication: 0,
    collaboration: 0,
    leadership: 0,
    conflict: 0,
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

    setScores((prev) => ({
      ...prev,
      [option.type]: prev[option.type] + option.impact,
    }));
  }, [scenario.options, showResult, metrics.score, updateMetrics]);

  const handleNext = useCallback(() => {
    if (currentIndex >= SCENARIOS.length - 1) {
      updateMetrics({
        extra: {
          communication_score: scores.communication,
          collaboration_score: scores.collaboration,
          team_lead_score: scores.leadership,
          conflict_score: scores.conflict,
        },
      });
      setIsComplete(true);
      return;
    }
    
    setCurrentIndex(currentIndex + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentIndex, scores, updateMetrics]);

  useEffect(() => {
    if (isComplete) {
      endGame();
    }
  }, [isComplete, endGame]);

  if (isComplete) {
    const maxScore = Math.max(scores.communication, scores.collaboration, scores.leadership, scores.conflict);
    const dominantType = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || "communication";

    const typeLabels: Record<string, string> = {
      communication: "Comunicacion",
      collaboration: "Colaboracion",
      leadership: "Liderazgo",
      conflict: "Resolucion de Conflictos",
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
          <div className="p-4 bg-blue-50 rounded-lg">
            <MessageCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Comunicacion</p>
            <p className="text-2xl font-bold text-blue-700">{scores.communication}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <Handshake className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Colaboracion</p>
            <p className="text-2xl font-bold text-green-700">{scores.collaboration}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Liderazgo</p>
            <p className="text-2xl font-bold text-purple-700">{scores.leadership}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <Handshake className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Conflictos</p>
            <p className="text-2xl font-bold text-orange-700">{scores.conflict}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-vocari-text-muted">
          Tu mayor fortaleza: <strong>{typeLabels[dominantType]}</strong>
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
            className="h-full bg-green-500 transition-all"
            style={{ width: `${((currentIndex + 1) / SCENARIOS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-vocari-text">{scenario.title}</h3>
        </div>
        
        <p className="text-lg text-vocari-text mb-2">{scenario.description}</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            <strong>Situacion:</strong> {scenario.situation}
          </p>
        </div>

        <div className="space-y-3">
          {scenario.options.map((option, index) => {
            let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-colors ";
            
            if (showResult) {
              if (index === selectedAnswer) {
                buttonClass += "border-green-500 bg-green-50 ";
              } else {
                buttonClass += "border-gray-100 ";
              }
            } else {
              buttonClass += "border-gray-200 hover:border-green-400 ";
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
