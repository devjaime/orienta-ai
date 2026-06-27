"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { AIAssistant } from "@/components/ai/AIAssistant";
import TestFlowVideoGate from "@/components/orientador/TestFlowVideoGate";
import { trackEvent } from "@/lib/utils/analytics";
import { riasecQuestions } from "@/lib/data/riasec-questions";
import { calcularCodigoRIASEC } from "@/lib/data/riasec-scoring";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Lightbulb,
  Mail,
  MessageSquare,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import type { RIASECDimension } from "@/lib/types/career";

type Step = "intro" | "test" | "resultsIntro" | "results";

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

const testQuestions = riasecQuestions;

const scaleOptions = [
  { value: 1, label: "Muy en desacuerdo", helper: "Casi nunca me representa" },
  { value: 2, label: "En desacuerdo", helper: "Me representa pocas veces" },
  { value: 3, label: "Neutral", helper: "Depende del contexto" },
  { value: 4, label: "De acuerdo", helper: "Me representa con frecuencia" },
  { value: 5, label: "Muy de acuerdo", helper: "Me representa totalmente" },
];

const dimensionNames: Record<RIASECDimension, string> = {
  R: "Realista",
  I: "Investigador",
  A: "Artistico",
  S: "Social",
  E: "Emprendedor",
  C: "Convencional",
};

const dimensionBadgeStyles: Record<RIASECDimension, string> = {
  R: "bg-red-100 text-red-800",
  I: "bg-blue-100 text-blue-800",
  A: "bg-purple-100 text-purple-800",
  S: "bg-green-100 text-green-800",
  E: "bg-amber-100 text-amber-800",
  C: "bg-slate-100 text-slate-800",
};

const dimensionAccentStyles: Record<RIASECDimension, string> = {
  R: "border-red-300",
  I: "border-blue-300",
  A: "border-purple-300",
  S: "border-green-300",
  E: "border-amber-300",
  C: "border-slate-300",
};

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const formatSalary = (range?: { min?: number; max?: number; median?: number }) => {
  if (!range?.median) return "No disponible";
  const lowerBound = range.min || range.median;
  const upperBound = range.max || range.median;
  return `${formatCLP(lowerBound)} - ${formatCLP(upperBound)}`;
};

const getMineducYear = (data: Record<string, unknown>) => {
  const yearKeys = ["year", "anio", "ano", "periodo"];
  for (const key of yearKeys) {
    const value = data[key];
    if (typeof value === "number") return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const getSaturationLabel = (index: number) => {
  if (index < 0.3) return { label: "Baja", color: "bg-green-100 text-green-800" };
  if (index < 0.6) return { label: "Media", color: "bg-amber-100 text-amber-800" };
  return { label: "Alta", color: "bg-red-100 text-red-800" };
};

const surveyScale = [
  { value: 1, label: "Muy baja" },
  { value: 2, label: "Baja" },
  { value: 3, label: "Media" },
  { value: 4, label: "Alta" },
  { value: 5, label: "Muy alta" },
];

/** Divide el texto del reporte en dos partes: antes y después de "Próximos Pasos". */
function splitReportText(text: string): { beforeNextSteps: string; nextSteps: string } {
  const idx = text.search(/(\d+[\.\)]\s*)?(pr[oó]ximos\s+pasos)/i);
  if (idx !== -1) {
    return {
      beforeNextSteps: text.slice(0, idx).trimEnd(),
      nextSteps: text.slice(idx),
    };
  }
  return { beforeNextSteps: text, nextSteps: "" };
}

export default function TestGratisPage() {
  const [step, setStep] = useState<Step>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [hollandCode, setHollandCode] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportGeneratedFor, setReportGeneratedFor] = useState("");
  const [reportError, setReportError] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [publicReportUrl, setPublicReportUrl] = useState<string | null>(null);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadError, setLeadError] = useState("");
  const [surveyClarity, setSurveyClarity] = useState<number | null>(null);
  const [surveyTrust, setSurveyTrust] = useState<number | null>(null);
  const [surveyRecommend, setSurveyRecommend] = useState<number | null>(null);
  const [surveyComment, setSurveyComment] = useState("");
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveyError, setSurveyError] = useState("");
  const recommendationsRequestRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLeadName(params.get("nombre")?.trim() || "");
    setLeadEmail(params.get("email")?.trim() || "");
  }, []);

  const getTopDimensions = (answersToUse: Record<number, number>) => {
    return calcularCodigoRIASEC(answersToUse).ranking
      .slice(0, 3)
      .map((item) => [item.dimension, item.score] as [RIASECDimension, number]);
  };

  const buildTestMetadata = (
    answersToUse: Record<number, number>,
    stepName = "test_completed",
  ) => {
    const result = calcularCodigoRIASEC(answersToUse);
    return {
      step: stepName,
      total_respuestas: Object.keys(answersToUse).length,
      total_preguntas: testQuestions.length,
      certeza: result.certeza,
      puntajes: result.puntajes,
      ranking: result.ranking,
    };
  };

  const resetFlow = () => {
    recommendationsRequestRef.current += 1;
    setStep("intro");
    setCurrentQuestion(0);
    setAnswers({});
    setRecommendations([]);
    setLoadingRecommendations(false);
    setReportGenerated(false);
    setReportText("");
    setReportGeneratedFor("");
    setReportError("");
    setLoading(false);
    setLoadingMessage("");
    setHollandCode("");
    setLeadId(null);
    setPublicReportUrl(null);
    setCopiedPublicUrl(false);
    setLeadError("");
    setSurveyClarity(null);
    setSurveyTrust(null);
    setSurveyRecommend(null);
    setSurveyComment("");
    setSurveyLoading(false);
    setSurveySubmitted(false);
    setSurveyError("");
  };

  const surveyComplete = surveyClarity !== null && surveyTrust !== null && surveyRecommend !== null;

  const generateReport = async () => {
    setLoading(true);
    setLoadingMessage("Generando tu informe vocacional...");
    setReportError("");
    try {
      const data = await api.post<{ generated_for: string; report_text: string }>(
        "/api/v1/leads/ai-report",
        {
          lead_id: leadId || undefined,
          nombre: leadName.trim(),
          holland_code: hollandCode || undefined,
          recommendations,
        },
      );
      setReportGenerated(true);
      setReportGeneratedFor(data.generated_for);
      setReportText(data.report_text);
      trackEvent("ai_report_generated", {
        page: "/test-gratis",
        lead_id: leadId || undefined,
        holland_code: hollandCode || undefined,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      setReportError("No se pudo generar el informe IA. Intenta nuevamente.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const startTest = () => {
    if (!leadName.trim()) {
      setLeadError("Ingresa tu nombre para continuar.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadEmail.trim())) {
      setLeadError("Ingresa un correo valido para continuar.");
      return;
    }

    setLeadError("");
    trackEvent("test_started", {
      page: "/test-gratis",
      email: leadEmail.trim().toLowerCase(),
    });
    setStep("test");
  };

  const submitSurvey = async () => {
    if (!surveyClarity || !surveyTrust || !surveyRecommend) {
      setSurveyError("Responde las 3 preguntas de la encuesta.");
      return;
    }

    setSurveyError("");
    setSurveyLoading(true);

    try {
      let currentLeadId = leadId;

      if (!currentLeadId) {
        const submitData = await api.post<{ lead_id: string; public_url: string }>(
          "/api/v1/tests/submit",
          {
            nombre: leadName.trim(),
            email: leadEmail.trim(),
            source: "test_gratis",
            holland_code: hollandCode || undefined,
            test_answers: answers,
            metadata: buildTestMetadata(answers),
          },
        );
        currentLeadId = submitData.lead_id;
        setLeadId(submitData.lead_id);
        const submitUrl = submitData.public_url.startsWith("http")
          ? submitData.public_url
          : `${window.location.origin}${submitData.public_url}`;
        setPublicReportUrl(submitUrl);
      }

      const surveyData = await api.post<{ lead_id: string; public_url: string }>(
        `/api/v1/leads/${currentLeadId}/survey`,
        {
          survey_response: {
            claridad_resultado: surveyClarity,
            confianza_datos_mineduc: surveyTrust,
            recomendaria_vocari: surveyRecommend,
            comentario: surveyComment.trim() || null,
          },
          metadata: {
            step: "feedback_submitted",
          },
        },
      );
      const absoluteUrl = surveyData.public_url.startsWith("http")
        ? surveyData.public_url
        : `${window.location.origin}${surveyData.public_url}`;
      setPublicReportUrl(absoluteUrl);
      setSurveySubmitted(true);
      trackEvent("survey_submitted", {
        page: "/test-gratis",
        lead_id: currentLeadId || undefined,
        holland_code: hollandCode || undefined,
      });
      // Navegar a resultados solo después de completar la encuesta obligatoria
      setStep("results");
    } catch (error) {
      console.error("Error enviando encuesta:", error);
      setSurveyError("No pudimos enviar tu respuesta. Intenta nuevamente.");
    } finally {
      setSurveyLoading(false);
    }
  };

  const fetchRecommendations = async (code: string) => {
    const requestId = ++recommendationsRequestRef.current;
    setLoadingRecommendations(true);

    try {
      const data = await api.get<{ recommendations: CareerRecommendation[] }>(
        `/api/v1/careers/public/recommendations?holland_code=${code}&limit=6`,
      );
      if (requestId === recommendationsRequestRef.current) {
        setRecommendations(data.recommendations || []);
      }
    } catch {
      if (requestId === recommendationsRequestRef.current) {
        setRecommendations([]);
      }
    } finally {
      if (requestId === recommendationsRequestRef.current) {
        setLoadingRecommendations(false);
      }
    }
  };

  const calculateResults = (answersToUse: Record<number, number>) => {
    const result = calcularCodigoRIASEC(answersToUse);
    const code = result.codigo_holland;
    setHollandCode(code);
    setStep("resultsIntro");
    trackEvent("test_completed", {
      page: "/test-gratis",
      lead_id: leadId || undefined,
      holland_code: code,
      certainty: result.certeza,
      total_answers: Object.keys(answersToUse).length,
    });

    void saveTestSnapshot(code, answersToUse);
    void fetchRecommendations(code);
  };

  const saveTestSnapshot = async (
    code: string,
    answersToUse: Record<number, number>,
  ) => {
    try {
      const data = await api.post<{ lead_id: string; public_url: string }>("/api/v1/tests/submit", {
        lead_id: leadId || undefined,
        nombre: leadName.trim(),
        email: leadEmail.trim(),
        source: "test_gratis",
        holland_code: code,
        test_answers: answersToUse,
        metadata: buildTestMetadata(answersToUse),
      });
      setLeadId(data.lead_id);
      const absoluteUrl = data.public_url.startsWith("http")
        ? data.public_url
        : `${window.location.origin}${data.public_url}`;
      setPublicReportUrl(absoluteUrl);
    } catch (error) {
      console.error("Error guardando snapshot del test:", error);
    }
  };

  const copyPublicUrl = async () => {
    if (!publicReportUrl) return;
    try {
      await navigator.clipboard.writeText(publicReportUrl);
      setCopiedPublicUrl(true);
      setTimeout(() => setCopiedPublicUrl(false), 1800);
    } catch (error) {
      console.error("No se pudo copiar el enlace:", error);
    }
  };

  const handleAnswer = (value: number) => {
    const questionId = testQuestions[currentQuestion].id;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    calculateResults(newAnswers);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vocari-bg via-white to-vocari-bg-warm">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-vocari-primary/10 text-vocari-primary rounded-full px-4 py-2 text-sm font-medium mb-4">
              <ShieldCheck className="w-4 h-4" />
              Metodologia RIASEC + datos de MINEDUC/SIES
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-vocari-text mb-4">
              Test vocacional gratis para decidir con datos reales
            </h1>
            <p className="text-vocari-text-muted text-lg max-w-3xl mx-auto">
              Responde 36 preguntas, descubre tu codigo Holland y revisa carreras
              con empleabilidad, ingresos y nivel de saturacion del mercado chileno.
            </p>
          </div>

          <div className="mb-6">
            <TestFlowVideoGate
              videoId="intro_test"
              storageKey="test_gratis_video_intro"
              analyticsContext={{ page: "/test-gratis", step: "intro" }}
            />
          </div>

          <Card className="mb-6 border-vocari-accent/40 bg-vocari-accent/5">
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-vocari-text">
                Confirma tus datos para personalizar recomendaciones y enviar seguimiento.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-vocari-text-muted mb-1 inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Nombre
                  </span>
                  <input
                    value={leadName}
                    onChange={(event) => setLeadName(event.target.value)}
                    placeholder="Tu nombre"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-vocari-text bg-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-vocari-text-muted mb-1 inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Correo
                  </span>
                  <input
                    value={leadEmail}
                    onChange={(event) => setLeadEmail(event.target.value)}
                    placeholder="tu@email.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-vocari-text bg-white"
                  />
                </label>
              </div>
              {leadError && <p className="text-sm text-red-700">{leadError}</p>}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="border-vocari-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 text-vocari-primary">
                  <Clock3 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Tiempo estimado</span>
                </div>
                <p className="text-2xl font-bold text-vocari-text">7-10 min</p>
                <p className="text-sm text-vocari-text-muted">Cuestionario completo de 36 preguntas</p>
              </CardContent>
            </Card>

            <Card className="border-vocari-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 text-vocari-primary">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-semibold">Resultado principal</span>
                </div>
                <p className="text-2xl font-bold text-vocari-text">Codigo RIASEC</p>
                <p className="text-sm text-vocari-text-muted">Tus 3 dimensiones dominantes</p>
              </CardContent>
            </Card>

            <Card className="border-vocari-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 text-vocari-primary">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Fuente de datos</span>
                </div>
                <p className="text-2xl font-bold text-vocari-text">MINEDUC/SIES</p>
                <p className="text-sm text-vocari-text-muted">Mercado laboral chileno</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Que incluye este test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-vocari-primary mt-0.5" />
                <div>
                  <p className="font-medium text-vocari-text">Evaluacion completa y estructurada</p>
                  <p className="text-sm text-vocari-text-muted">
                    36 preguntas del modelo RIASEC para perfilar tus intereses vocacionales.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-vocari-primary mt-0.5" />
                <div>
                  <p className="font-medium text-vocari-text">Ranking de carreras compatibles</p>
                  <p className="text-sm text-vocari-text-muted">
                    Compatibilidad estimada con tu perfil + razones de ajuste.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-vocari-primary mt-0.5" />
                <div>
                  <p className="font-medium text-vocari-text">Indicadores de decision</p>
                  <p className="text-sm text-vocari-text-muted">
                    Empleabilidad, rango salarial y saturacion para comparar opciones.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-vocari-primary mt-0.5" />
                <div>
                  <p className="font-medium text-vocari-text">Acceso inmediato</p>
                  <p className="text-sm text-vocari-text-muted">
                    Gratis, sin pago ni pasos complejos para comenzar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={startTest} size="lg" className="text-lg px-8 py-4">
              Comenzar test gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "test") {
    const question = testQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / testQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-vocari-bg via-white to-vocari-bg-warm">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card className="mb-5">
            <CardContent className="pt-4">
              <div className="flex justify-between text-sm text-vocari-text-muted mb-2">
                <span>Pregunta {currentQuestion + 1} de {testQuestions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <ProgressBar value={progress} className="h-2 mb-3" />
              <p className="text-xs text-vocari-text-muted">
                Responde con honestidad. No hay respuestas correctas o incorrectas.
              </p>
            </CardContent>
          </Card>

          <Card className={`mb-6 border-2 ${dimensionAccentStyles[question.dimension]}`}>
            <CardContent className="pt-6">
              <Badge className={`mb-4 ${dimensionBadgeStyles[question.dimension]}`}>
                Dimension: {dimensionNames[question.dimension]}
              </Badge>
              <p className="text-xl md:text-2xl font-semibold text-vocari-text leading-relaxed">
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
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-vocari-primary text-white text-sm font-semibold mr-3">
                  {option.value}
                </span>
                <span>
                  <span className="block text-vocari-text font-medium">{option.label}</span>
                  <span className="block text-xs text-vocari-text-muted">{option.helper}</span>
                </span>
              </Button>
            ))}
          </div>

          <div className="mt-6">
            <Button
              variant="ghost"
              className="px-0 text-vocari-text-muted"
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

  if (step === "resultsIntro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vocari-bg via-white to-vocari-bg-warm">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-5">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-vocari-text mb-2">
              Revisemos tu resultado vocacional
            </h2>
            <p className="text-vocari-text-muted">
              Antes de mostrar tu informe, mira esta breve guía para entender mejor cómo interpretar tus recomendaciones.
            </p>
          </div>

          <TestFlowVideoGate
            videoId="intro_resultado"
            storageKey="test_gratis_video_intro_resultado"
            analyticsContext={{ page: "/test-gratis", step: "before_results" }}
            onContinue={() => setStep("results")}
          />

          <div className="text-center">
            <Button onClick={() => setStep("results")}>
              Ir al resultado ahora
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "results") {
    const topDims = getTopDimensions(answers);

    return (
      <div className="min-h-screen bg-gradient-to-br from-vocari-bg via-white to-vocari-bg-warm">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-vocari-primary/10 text-vocari-primary rounded-full px-4 py-2 text-sm font-medium mb-3">
              <Lightbulb className="w-4 h-4" />
              Resultado vocacional personalizado
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-vocari-text mb-2">
              Tu perfil vocacional es {hollandCode}
            </h1>
            <p className="text-vocari-text-muted max-w-3xl mx-auto">
              Esta recomendacion combina tus intereses (RIASEC) con indicadores del mercado chileno
              para ayudarte a priorizar carreras con mejor ajuste y proyeccion.
            </p>
          </div>

          {publicReportUrl && (
            <Card className="mb-8 border-vocari-primary/30 bg-vocari-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Enlace aparte del informe guardado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-vocari-text-muted">
                  Este es el link público independiente para revisar exactamente lo almacenado.
                </p>
                <p className="text-xs bg-white border border-gray-200 rounded p-2 break-all">
                  {publicReportUrl}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(publicReportUrl, "_blank", "noopener,noreferrer")}
                  >
                    Abrir enlace aparte
                  </Button>
                  <Button size="sm" variant="secondary" onClick={copyPublicUrl}>
                    {copiedPublicUrl ? "Copiado" : "Copiar enlace"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {topDims.map(([dim, score]) => (
              <Card key={dim} className={`border-2 ${dimensionAccentStyles[dim]}`}>
                <CardContent className="pt-4">
                  <Badge className={dimensionBadgeStyles[dim]}>{dim} - {dimensionNames[dim]}</Badge>
                  <p className="mt-3 text-2xl font-bold text-vocari-text">{score} pts</p>
                  <p className="text-sm text-vocari-text-muted">Intensidad de interes detectada</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-8">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-vocari-primary" />
              Carreras recomendadas con referencia MINEDUC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              {loadingRecommendations ? (
                <div className="rounded-xl border border-vocari-primary/30 bg-vocari-primary/5 p-6">
                  <div className="flex items-center gap-3">
                    <Spinner size="md" />
                    <div>
                      <p className="font-medium text-vocari-text">
                        Cruzando tu perfil con carreras del mercado chileno...
                      </p>
                      <p className="text-sm text-vocari-text-muted">
                        Esto puede tardar unos segundos segun la disponibilidad de datos.
                      </p>
                    </div>
                  </div>
                </div>
              ) : recommendations.length > 0 ? (
                recommendations.map((recommendation) => {
                  const saturation = getSaturationLabel(recommendation.career.saturation_index);
                  const sourceYear = getMineducYear(recommendation.career.mineduc_data);

                  return (
                    <div
                      key={recommendation.career.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-vocari-primary/40 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-vocari-text">
                            {recommendation.career.name}
                          </h3>
                          <p className="text-sm text-vocari-text-muted">{recommendation.career.area}</p>
                        </div>
                        <Badge className="bg-vocari-primary text-white w-fit">
                          {Math.round(recommendation.match_score)}% compatibilidad
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-vocari-text-muted text-xs mb-1">Ingreso estimado</p>
                          <p className="font-semibold text-vocari-text">
                            {formatSalary(recommendation.career.salary_range)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-vocari-text-muted text-xs mb-1">Empleabilidad</p>
                          <p className="font-semibold text-green-700">
                            {Math.round(recommendation.career.employability * 100)}%
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-vocari-text-muted text-xs mb-1">Saturacion</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${saturation.color}`}>
                            {saturation.label}
                          </span>
                        </div>
                      </div>

                      {recommendation.match_reasons.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-vocari-text-muted mb-1">Motivo principal de ajuste</p>
                          <p className="text-sm text-vocari-text">{recommendation.match_reasons[0]}</p>
                        </div>
                      )}

                      <p className="mt-3 text-xs text-vocari-text-muted">
                        Fuente: MINEDUC/SIES{sourceYear ? ` (${sourceYear})` : ""}.
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-vocari-text-muted py-6">
                  No se encontraron recomendaciones en este intento. Puedes repetir el test.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8 border border-vocari-primary/30 bg-gradient-to-r from-vocari-bg to-white">
            <CardContent className="pt-6">
              {reportGenerated ? (
                (() => {
                  const { beforeNextSteps, nextSteps } = splitReportText(reportText);
                  return (
                    <>
                      <h2 className="text-xl font-bold mb-3 text-center">
                        Informe IA personalizado para {reportGeneratedFor || leadName}
                      </h2>

                      {/* Parte 1 del informe — siempre visible */}
                      <div className="bg-white rounded-lg p-4 mb-5 text-left border border-gray-200">
                        <p className="text-sm whitespace-pre-line leading-relaxed text-vocari-text">
                          {beforeNextSteps}
                        </p>
                      </div>

                      {/* Próximos Pasos — bloqueados hasta completar encuesta */}
                      {nextSteps ? (
                        surveySubmitted ? (
                          /* Desbloqueado: mostrar próximos pasos */
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5 text-left">
                            <p className="text-sm whitespace-pre-line leading-relaxed text-vocari-text">
                              {nextSteps}
                            </p>
                          </div>
                        ) : (
                          /* Bloqueado: mostrar encuesta */
                          <div className="space-y-4 mb-5">
                            <div className="rounded-xl border border-vocari-primary/40 bg-vocari-primary/5 p-5 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-vocari-primary/10 mb-3">
                                <MessageSquare className="w-6 h-6 text-vocari-primary" />
                              </div>
                              <h3 className="text-lg font-bold text-vocari-text mb-1">
                                🔒 Próximos Pasos Recomendados
                              </h3>
                              <p className="text-vocari-text-muted text-sm">
                                Para poder entregar tu reporte completo, favor completa esta breve encuesta.
                              </p>
                            </div>

                            <Card className="border border-gray-200">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                  <MessageSquare className="w-4 h-4 text-vocari-primary" />
                                  Encuesta breve (30 segundos)
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-5">
                                <div>
                                  <p className="text-sm font-medium text-vocari-text mb-2">
                                    1) ¿Qué tan claro te resultó el resultado del test?
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {surveyScale.map((option) => (
                                      <Button
                                        key={`clarity-${option.value}`}
                                        variant={surveyClarity === option.value ? "primary" : "secondary"}
                                        size="sm"
                                        onClick={() => setSurveyClarity(option.value)}
                                      >
                                        {option.value} — {option.label}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-vocari-text mb-2">
                                    2) ¿Cuánta confianza te dieron los datos de MINEDUC/SIES?
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {surveyScale.map((option) => (
                                      <Button
                                        key={`trust-${option.value}`}
                                        variant={surveyTrust === option.value ? "primary" : "secondary"}
                                        size="sm"
                                        onClick={() => setSurveyTrust(option.value)}
                                      >
                                        {option.value} — {option.label}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-vocari-text mb-2">
                                    3) ¿Qué tan probable es que recomiendes Vocari?
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {surveyScale.map((option) => (
                                      <Button
                                        key={`recommend-${option.value}`}
                                        variant={surveyRecommend === option.value ? "primary" : "secondary"}
                                        size="sm"
                                        onClick={() => setSurveyRecommend(option.value)}
                                      >
                                        <Star className="w-3 h-3 mr-1" />
                                        {option.value} — {option.label}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-vocari-text mb-2">
                                    Comentario opcional
                                  </label>
                                  <textarea
                                    value={surveyComment}
                                    onChange={(event) => setSurveyComment(event.target.value)}
                                    placeholder="¿Qué te gustaría mejorar?"
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-vocari-text"
                                  />
                                </div>

                                {surveyError && <p className="text-sm text-red-700">{surveyError}</p>}

                                <Button
                                  onClick={submitSurvey}
                                  loading={surveyLoading}
                                  disabled={!surveyComplete}
                                  className="w-full"
                                >
                                  {surveyComplete
                                    ? "Ver mis próximos pasos →"
                                    : "Responde las 3 preguntas para continuar"}
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        )
                      ) : null}

                      {/* Confirmación post-encuesta */}
                      {surveySubmitted && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-4 text-green-800 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          Gracias por completar la encuesta. Tu feedback fue registrado.
                        </div>
                      )}

                      <div className="text-center">
                        <Button variant="primary" onClick={generateReport} loading={loading}>
                          Regenerar informe IA
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">¿Quieres un informe completo?</h2>
                  <p className="text-vocari-text-muted mb-4">
                    Genera un reporte extendido con interpretación personalizada y siguientes pasos
                    para tu decisión vocacional.
                  </p>
                  {loading && loadingMessage && (
                    <p className="text-sm text-vocari-text-muted mb-3">{loadingMessage}</p>
                  )}
                  {reportError && <p className="text-sm text-red-700 mb-3">{reportError}</p>}
                  <Button variant="primary" onClick={generateReport} loading={loading}>
                    Generar informe con IA
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mb-8">
            <TestFlowVideoGate
              videoId="cierre_motivacional"
              storageKey="test_gratis_video_cierre"
              analyticsContext={{ page: "/test-gratis", step: "closing" }}
            />
          </div>

          <div className="text-center">
            <Button variant="ghost" onClick={resetFlow}>
              Repetir test
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
