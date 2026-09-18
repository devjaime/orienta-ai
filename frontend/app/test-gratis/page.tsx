"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { trackEvent } from "@/lib/utils/analytics";
import { calcularCodigoRIASEC } from "@/lib/data/riasec-scoring";
import {
  type CareerRecommendation,
  type Step,
  buildTestMetadata,
  testQuestions,
} from "./shared";
import { IntroStep } from "./IntroStep";
import { TestStep } from "./TestStep";
import { ResultsIntroStep } from "./ResultsIntroStep";
import { ResultsStep } from "./ResultsStep";

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
          metadata: { step: "feedback_submitted" },
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

  const saveTestSnapshot = async (code: string, answersToUse: Record<number, number>) => {
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
      <IntroStep
        leadName={leadName}
        leadEmail={leadEmail}
        leadError={leadError}
        setLeadName={setLeadName}
        setLeadEmail={setLeadEmail}
        startTest={startTest}
      />
    );
  }

  if (step === "test") {
    return (
      <TestStep
        currentQuestion={currentQuestion}
        handleAnswer={handleAnswer}
        handlePreviousQuestion={handlePreviousQuestion}
      />
    );
  }

  if (step === "resultsIntro") {
    return <ResultsIntroStep goResults={() => setStep("results")} />;
  }

  if (step === "results") {
    return (
      <ResultsStep
        answers={answers}
        hollandCode={hollandCode}
        publicReportUrl={publicReportUrl}
        copiedPublicUrl={copiedPublicUrl}
        copyPublicUrl={copyPublicUrl}
        loadingRecommendations={loadingRecommendations}
        recommendations={recommendations}
        reportGenerated={reportGenerated}
        reportGeneratedFor={reportGeneratedFor}
        reportText={reportText}
        reportError={reportError}
        loading={loading}
        loadingMessage={loadingMessage}
        generateReport={generateReport}
        surveySubmitted={surveySubmitted}
        surveyClarity={surveyClarity}
        surveyTrust={surveyTrust}
        surveyRecommend={surveyRecommend}
        surveyComment={surveyComment}
        surveyLoading={surveyLoading}
        surveyError={surveyError}
        surveyComplete={surveyComplete}
        setSurveyClarity={setSurveyClarity}
        setSurveyTrust={setSurveyTrust}
        setSurveyRecommend={setSurveyRecommend}
        setSurveyComment={setSurveyComment}
        submitSurvey={submitSurvey}
        resetFlow={resetFlow}
        leadName={leadName}
        leadEmail={leadEmail}
        leadId={leadId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aura-primary/5 to-aura-violet/5">
      <AIAssistant />
    </div>
  );
}
