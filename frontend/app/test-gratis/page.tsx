"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { AIAssistant } from "@/components/ai/AIAssistant";
import {
  Lightbulb,
  TrendingUp,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import type { RIASECDimension } from "@/lib/types/career";

interface CareerRecommendation {
  career: {
    id: string;
    name: string;
    area: string;
    holland_codes: string[];
    description: string;
    salary_range: { min?: number; max?: number; median?: number };
    employability: number;
    saturation_index: number;
    mineduc_data: Record<string, unknown>;
  };
  match_score: number;
  match_reasons: string[];
}

const quickQuestions = [
  // Realista (R) - 4 preguntas
  { id: 1, dimension: "R", text: "Me gusta trabajar con herramientas y maquinaria" },
  { id: 2, dimension: "R", text: "Disfruto actividades al aire libre y trabajo practico" },
  { id: 3, dimension: "R", text: "Me interesa como funcionan las cosas (mecanica, electricidad)" },
  { id: 4, dimension: "R", text: "Prefiero trabajos donde pueda ver resultados concretos de mi trabajo" },
  // Investigador (I) - 4 preguntas
  { id: 5, dimension: "I", text: "Me gusta analizar datos y encontrar patrones" },
  { id: 6, dimension: "I", text: "Disfruto resolver problemas complejos que requieren pensamiento logico" },
  { id: 7, dimension: "I", text: "Me interesa investigar y descubrir como funcionan las cosas a nivel profundo" },
  { id: 8, dimension: "I", text: "Disfruto aprender sobre ciencia, matematicas o tecnologia" },
  // Artistico (A) - 4 preguntas
  { id: 9, dimension: "A", text: "Me gusta expresarme creativamente y crear cosas nuevas" },
  { id: 10, dimension: "A", text: "Prefiero trabajos que me permitan usar mi imaginacion" },
  { id: 11, dimension: "A", text: "Me siento comodo en ambientes pocos estructurados y flexibles" },
  { id: 12, dimension: "A", text: "Me interesa la estetica y el diseno visual de las cosas" },
  // Social (S) - 4 preguntas
  { id: 13, dimension: "S", text: "Me gusta ayudar a otras personas y trabajar en equipo" },
  { id: 14, dimension: "S", text: "Disfruto ensenar y compartir conocimientos con otros" },
  { id: 15, dimension: "S", text: "Me interesa el bienestar y desarrollo de los demas" },
  { id: 16, dimension: "S", text: "Prefiero trabajos que impliquen interaccion directa con personas" },
  // Emprendedor (E) - 4 preguntas
  { id: 17, dimension: "E", text: "Me gusta liderar proyectos y tomar decisiones importantes" },
  { id: 18, dimension: "E", text: "Disfruto persuadir y convencer a otros de mis ideas" },
  { id: 19, dimension: "E", text: "Me gusta asumir riesgos y enfrentar nuevos desafios" },
  { id: 20, dimension: "E", text: "Me interesa el mundo de los negocios y las oportunidades comerciales" },
  // Convencional (C) - 4 preguntas
  { id: 21, dimension: "C", text: "Me gusta trabajar con datos, numeros y sistemas organizados" },
  { id: 22, dimension: "C", text: "Prefiero seguir procedimientos y completar tareas con precision" },
  { id: 23, dimension: "C", text: "Me siento comodo en ambientes estructurados y predecibles" },
  { id: 24, dimension: "C", text: "Me interesa la administracion y organizacion de informacion" },
];

const dimensionNames: Record<RIASECDimension, string> = {
  R: "Realista",
  I: "Investigador",
  A: "Artistico",
  S: "Social",
  E: "Emprendedor",
  C: "Convencional",
};

const dimensionColors: Record<RIASECDimension, string> = {
  R: "bg-red-500",
  I: "bg-blue-500",
  A: "bg-purple-500",
  S: "bg-green-500",
  E: "bg-yellow-500",
  C: "bg-orange-500",
};

export default function TestGratisPage() {
  const [step, setStep] = useState<"intro" | "test" | "results">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [hollandCode, setHollandCode] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportUrl, setReportUrl] = useState("");

  const generateReport = async () => {
    setLoading(true);
    setLoadingMessage("Generando tu informe con IA...");
    try {
      const data = await api.post<{ share_token: string; share_url: string }>(
        "/api/v1/reports/generate",
        { report_type: "comprehensive" }
      );
      setReportGenerated(true);
      setReportUrl(data.share_url);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleAnswer = (value: number) => {
    const questionId = quickQuestions[currentQuestion].id;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentQuestion < quickQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = async (answersToUse: Record<number, number>) => {
    setLoading(true);
    setLoadingMessage("Calculando tu perfil vocacional...");

    const scores: Record<RIASECDimension, number> = {
      R: 0,
      I: 0,
      A: 0,
      S: 0,
      E: 0,
      C: 0,
    };

    quickQuestions.forEach((q) => {
      const answer = answersToUse[q.id] || 0;
      scores[q.dimension as RIASECDimension] += answer;
    });

    const sortedDims = (Object.entries(scores) as [RIASECDimension, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const code = sortedDims.map(([dim]) => dim).join("");
    setHollandCode(code);

    setLoadingMessage("Buscando las mejores carreras para ti...");

    try {
      const data = await api.get<{ recommendations: CareerRecommendation[] }>(
        `/api/v1/careers/recommendations?holland_code=${code}&limit=6`
      );
      setRecommendations(data.recommendations || []);
    } catch {
      setRecommendations([]);
    }

    setLoading(false);
    setStep("results");
  };

  const getTopDimensions = () => {
    const scores: Record<RIASECDimension, number> = {
      R: 0,
      I: 0,
      A: 0,
      S: 0,
      E: 0,
      C: 0,
    };

    quickQuestions.forEach((q) => {
      const answer = answers[q.id] || 0;
      scores[q.dimension as RIASECDimension] += answer;
    });

    return (Object.entries(scores) as [RIASECDimension, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const getSaturationLabel = (index: number) => {
    if (index < 0.3) return { label: "Bajo", color: "bg-green-100 text-green-800" };
    if (index < 0.6) return { label: "Medio", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Alto", color: "bg-red-100 text-red-800" };
  };

  const formatSalary = (range?: { min?: number; max?: number; median?: number }) => {
    if (!range?.median) return "No disponible";
    return `$${(range.median / 1000).toFixed(0)}k - $${((range.max || range.median * 1.3) / 1000).toFixed(0)}k CLP`;
  };

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vocari-bg to-vocari-bg-warm">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-vocari-primary/10 rounded-full mb-6">
              <Lightbulb className="w-8 h-8 text-vocari-primary" />
            </div>
            <h1 className="text-4xl font-bold text-vocari-text mb-4">
              Test Vocacional Gratis
            </h1>
            <p className="text-xl text-vocari-text-muted">
              Descubre tu perfil vocacional y las carreras ideales para ti
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Que incluye este test?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-vocari-primary mt-0.5" />
                <div>
                  <p className="font-medium text-vocari-text">24 preguntas</p>
                  <p className="text-sm text-vocari-text-muted">
                    Basadas en el modelo RIASEC, el mas utilizado en orientacion vocacional
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-vocari-primary mt-0.5" />
                <div>
                  <p className="font-medium text-vocari-text">Tu codigo Holland</p>
                  <p className="text-sm text-vocari-text-muted">
                    Conoce tus 3 dimensiones principales de personalidad
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-vocari-primary mt-0.5" />
                <div>
                  <p className="font-medium text-vocari-text">Carreras con datos reales</p>
                  <p className="text-sm text-vocari-text-muted">
                    Empleabilidad, salario y nivel de saturacion del mercado chileno
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-vocari-primary mt-0.5" />
                <div>
                  <p className="font-medium text-vocari-text">100% Gratis</p>
                  <p className="text-sm text-vocari-text-muted">
                    Sin registro requerido para hacer el test
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={() => setStep("test")}
              size="lg"
              className="text-lg px-8 py-4"
            >
              Comenzar Test Gratuito
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "test") {
    const question = quickQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / quickQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-vocari-bg to-vocari-bg-warm">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-vocari-text-muted mb-2">
              <span>Pregunta {currentQuestion + 1} de {quickQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} className="h-2" />
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <Badge className={`mb-4 ${dimensionColors[question.dimension as RIASECDimension]}`}>
                Dimension: {dimensionNames[question.dimension as RIASECDimension]}
              </Badge>
              <p className="text-xl font-medium text-vocari-text">{question.text}</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant="secondary"
                className="w-full text-left justify-start h-auto py-4 px-6"
                onClick={() => handleAnswer(value)}
              >
                <span className="text-vocari-text-muted mr-3">{value}</span>
                {value === 1 && "Totalmente en desacuerdo"}
                {value === 2 && "En desacuerdo"}
                {value === 3 && "Neutral"}
                {value === 4 && "De acuerdo"}
                {value === 5 && "Totalmente de acuerdo"}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "results") {
    const topDims = getTopDimensions();

    return (
      <div className="min-h-screen bg-gradient-to-br from-vocari-bg to-vocari-bg-warm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-vocari-text mb-2">
              Tu Perfil Vocacional
            </h1>
            <p className="text-vocari-text-muted">
              Basado en tus respuestas, este es tu codigo Holland:
            </p>
            <div className="mt-4 inline-flex gap-2">
              {topDims.map(([dim, score]) => (
                <div
                  key={dim}
                  className={`px-4 py-2 rounded-lg ${dimensionColors[dim]} text-white font-bold`}
                >
                  {dim}
                  <span className="block text-xs font-normal opacity-80">
                    {dimensionNames[dim]} ({score} pts)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Carreras Recomendadas para Ti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="mt-4 text-vocari-text-muted">
                    {loadingMessage || "Analizando tu perfil y buscando las mejores opciones..."}
                  </p>
                </div>
              ) : recommendations.length > 0 ? (
                recommendations.map((rec) => {
                  const saturation = getSaturationLabel(rec.career.saturation_index);
                  return (
                    <div
                      key={rec.career.id}
                      className="border rounded-lg p-4 hover:border-vocari-primary/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-vocari-text">
                            {rec.career.name}
                          </h3>
                          <p className="text-sm text-vocari-text-muted">
                            {rec.career.area}
                          </p>
                        </div>
                        <Badge className={dimensionColors[rec.career.holland_codes[0] as RIASECDimension] || "bg-gray-500"}>
                          {Math.round(rec.match_score)}% compatibilidad
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-vocari-text-muted text-xs">Salario mensual</p>
                          <p className="font-medium text-vocari-text">
                            {formatSalary(rec.career.salary_range)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-vocari-text-muted text-xs">Empleabilidad</p>
                          <p className="font-medium text-green-600">
                            {Math.round(rec.career.employability * 100)}%
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-vocari-text-muted text-xs">Saturacion</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${saturation.color}`}>
                            {saturation.label}
                          </span>
                        </div>
                      </div>

                      {rec.match_reasons.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-vocari-text-muted mb-1">Por que es para ti:</p>
                          <p className="text-sm text-vocari-text">{rec.match_reasons[0]}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-vocari-text-muted py-4">
                  No se encontraron recomendaciones. Intenta con un perfil diferente.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8 bg-gradient-to-r from-vocari-primary to-vocari-accent text-white">
            <CardContent className="pt-6 text-center">
              {reportGenerated ? (
                <>
                  <h2 className="text-xl font-bold mb-2">
                    Informe generado exitosamente!
                  </h2>
                  <p className="opacity-90 mb-4">
                    Comparte este enlace con quien quieras:
                  </p>
                  <div className="bg-white/10 rounded-lg p-3 mb-4">
                    <p className="text-sm break-all font-mono">{reportUrl}</p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-white text-vocari-primary hover:bg-gray-100"
                    onClick={() => window.open(reportUrl, "_blank")}
                  >
                    Ver Informe
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-2">
                    quieres un informe completo con IA?
                  </h2>
                  <p className="opacity-90 mb-4">
                    Obtén un análisis personalizado con recomendaciones especificas,
                    datos actualizados del mercado laboral y proximos pasos.
                  </p>
                  <Button
                    variant="secondary"
                    className="bg-white text-vocari-primary hover:bg-gray-100"
                    onClick={generateReport}
                    loading={loading}
                  >
                    Generar Informe con IA
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="ghost" onClick={() => {
              setStep("intro");
              setCurrentQuestion(0);
              setAnswers({});
              setRecommendations([]);
              setReportGenerated(false);
              setReportUrl("");
              setLoading(false);
              setLoadingMessage("");
            }}>
              Repetir Test
            </Button>
          </div>

          <AIAssistant />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vocari-bg to-vocari-bg-warm">
      <AIAssistant />
    </div>
  );
}
