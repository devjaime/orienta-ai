"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Mail,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  reconversionDimensionLabels,
  reconversionQuestions,
} from "@/lib/data/reconversion-questions";
import {
  reconversionPhaseTwoLabels,
  reconversionPhaseTwoScenarios,
} from "@/lib/data/reconversion-phase-two";
import {
  reconversionPhaseThreeLabels,
  reconversionPhaseThreeQuestions,
} from "@/lib/data/reconversion-phase-three";
import { reconversionPhaseFourScenarios } from "@/lib/data/reconversion-phase-four";

type Stage = "phase_0" | "phase_1" | "phase_2" | "phase_3" | "phase_4" | "done";

interface SessionResponse {
  id: string;
  share_token: string;
  nombre: string;
  email: string;
  profesion_actual: string;
  edad: number;
  current_phase: number;
  status: string;
  summary_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PhaseOneSummary {
  dimension_scores: Record<string, number>;
  top_dimensions: string[];
  profile_summary: string;
  consistency_hint: string;
}

interface PhaseOneResponse {
  success: boolean;
  session_id: string;
  current_phase: number;
  phase_key: string;
  summary: PhaseOneSummary;
}

interface PhaseTwoSummary {
  energy_scores: Record<string, number>;
  energy_map: string[];
  drain_map: string[];
  dominant_work_modes: string[];
  challenge_readout: string;
  transition_signal: string;
}

interface PhaseTwoResponse {
  success: boolean;
  session_id: string;
  current_phase: number;
  phase_key: string;
  summary: PhaseTwoSummary;
}

interface PhaseThreeSummary {
  confirmation_scores: Record<string, number>;
  confirmed_signals: string[];
  tension_signals: string[];
  confidence_score: number;
  confidence_label: string;
  confirmation_readout: string;
}

interface PhaseThreeResponse {
  success: boolean;
  session_id: string;
  current_phase: number;
  phase_key: string;
  summary: PhaseThreeSummary;
}

interface PhaseFourSummary {
  tradeoff_scores: Record<string, number>;
  tradeoff_profile: string[];
  change_readiness: number;
  mobility_readiness: string;
  upskilling_readiness: string;
  preferred_work_setup: string;
  income_tension: string;
  decision_summary: string;
  constraints_to_respect: string[];
}

interface PhaseFourResponse {
  success: boolean;
  session_id: string;
  current_phase: number;
  phase_key: string;
  summary: PhaseFourSummary;
}

interface GenerateReportResponse {
  success: boolean;
  session_id: string;
  share_token: string;
  public_url: string;
  model_name: string;
  prompt_version: string;
  generated_at: string | null;
}

const scaleOptions = [
  { value: 1, label: "Muy en desacuerdo" },
  { value: 2, label: "En desacuerdo" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "De acuerdo" },
  { value: 5, label: "Muy de acuerdo" },
];

const initialForm = {
  nombre: "",
  email: "",
  profesion_actual: "",
  edad: "",
  pais: "Chile",
  ciudad: "",
  nivel_educativo: "",
  ingreso_actual_aprox: "",
  nivel_ingles: "Basico",
  situacion_actual: "",
  disponibilidad_para_estudiar: "",
  disponibilidad_para_relocalizarse: "",
};

export default function ReconversionGratisPage() {
  const [stage, setStage] = useState<Stage>("phase_0");
  const [form, setForm] = useState(initialForm);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phaseTwoAnswers, setPhaseTwoAnswers] = useState<
    Record<number, "energiza" | "neutral" | "drena">
  >({});
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [phaseThreeAnswers, setPhaseThreeAnswers] = useState<
    Record<number, number>
  >({});
  const [currentConfirmQuestionIndex, setCurrentConfirmQuestionIndex] =
    useState(0);
  const [phaseFourAnswers, setPhaseFourAnswers] = useState<
    Record<number, "a" | "b" | "c">
  >({});
  const [currentTradeoffIndex, setCurrentTradeoffIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phaseSummary, setPhaseSummary] = useState<PhaseOneSummary | null>(
    null,
  );
  const [phaseTwoSummary, setPhaseTwoSummary] =
    useState<PhaseTwoSummary | null>(null);
  const [phaseThreeSummary, setPhaseThreeSummary] =
    useState<PhaseThreeSummary | null>(null);
  const [phaseFourSummary, setPhaseFourSummary] =
    useState<PhaseFourSummary | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | null>(
    null,
  );

  const currentQuestion = reconversionQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const questionProgress =
    ((currentQuestionIndex + 1) / reconversionQuestions.length) * 100;
  const currentScenario = reconversionPhaseTwoScenarios[currentScenarioIndex];
  const phaseTwoAnsweredCount = Object.keys(phaseTwoAnswers).length;
  const phaseTwoProgress =
    ((currentScenarioIndex + 1) / reconversionPhaseTwoScenarios.length) * 100;
  const currentConfirmQuestion =
    reconversionPhaseThreeQuestions[currentConfirmQuestionIndex];
  const phaseThreeAnsweredCount = Object.keys(phaseThreeAnswers).length;
  const phaseThreeProgress =
    ((currentConfirmQuestionIndex + 1) /
      reconversionPhaseThreeQuestions.length) *
    100;
  const currentTradeoff = reconversionPhaseFourScenarios[currentTradeoffIndex];
  const phaseFourAnsweredCount = Object.keys(phaseFourAnswers).length;
  const phaseFourProgress =
    ((currentTradeoffIndex + 1) / reconversionPhaseFourScenarios.length) * 100;

  function updateForm(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateSession() {
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        edad: Number(form.edad),
        ingreso_actual_aprox: form.ingreso_actual_aprox
          ? Number(form.ingreso_actual_aprox)
          : null,
      };

      const response = await api.post<SessionResponse>(
        "/api/v1/reconversion/sessions",
        payload,
      );
      setSession(response);
      setStage("phase_1");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No pudimos iniciar tu evaluacion. Intenta nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitPhaseOne() {
    if (!session) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post<PhaseOneResponse>(
        `/api/v1/reconversion/sessions/${session.id}/phase-1`,
        { answers },
      );
      setPhaseSummary(response.summary);
      setStage("phase_2");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No pudimos guardar tus respuestas. Intenta nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitPhaseTwo() {
    if (!session) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post<PhaseTwoResponse>(
        `/api/v1/reconversion/sessions/${session.id}/phase-2`,
        { answers: phaseTwoAnswers },
      );
      setPhaseTwoSummary(response.summary);
      setCurrentConfirmQuestionIndex(0);
      setStage("phase_3");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No pudimos guardar el desafio de energia. Intenta nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitPhaseThree() {
    if (!session) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post<PhaseThreeResponse>(
        `/api/v1/reconversion/sessions/${session.id}/phase-3`,
        { answers: phaseThreeAnswers },
      );
      setPhaseThreeSummary(response.summary);
      setCurrentTradeoffIndex(0);
      setStage("phase_4");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No pudimos guardar la fase confirmatoria. Intenta nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitPhaseFour() {
    if (!session) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post<PhaseFourResponse>(
        `/api/v1/reconversion/sessions/${session.id}/phase-4`,
        { answers: phaseFourAnswers },
      );
      setPhaseFourSummary(response.summary);
      setStage("done");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No pudimos guardar el desafio de decisiones. Intenta nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReport() {
    if (!session) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post<GenerateReportResponse>(
        `/api/v1/reconversion/sessions/${session.id}/generate-report`,
      );
      setReportUrl(response.public_url);
      setReportGeneratedAt(response.generated_at);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No pudimos generar el informe final. Intenta nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isPhaseZeroValid =
    form.nombre.trim() &&
    form.email.trim() &&
    form.profesion_actual.trim() &&
    form.edad.trim();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4f0e8,_#f8fafc_45%,_#eef2ff_100%)]">
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 grid gap-4 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Vocari Reconversion
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Explora un futuro laboral con mejor ajuste para tu vida adulta.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Este flujo inicial cruza tu contexto actual con un test de
              reconversion para detectar energias, motivadores y una primera
              hipotesis de camino profesional.
            </p>
          </div>

          <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Lo que cubre esta primera version
              </p>
              <div className="grid gap-2 text-sm text-slate-600">
                <p>Fase 0: contexto actual y situacion laboral.</p>
                <p>Fase 1: test base de 30 preguntas.</p>
                <p>Fase 2: desafio de energia laboral con escenarios reales.</p>
                <p>Fase 3: test confirmatorio para afinar la hipotesis.</p>
                <p>Fase 4: decisiones con trade-offs de reconversion real.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {stage === "phase_0" && (
          <Card className="border-slate-200 bg-white/95 shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-900 p-3 text-white">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Fase 0 · Tu punto de partida</CardTitle>
                  <p className="text-sm text-slate-500">
                    Antes de sugerir cambios, necesitamos entender tu contexto
                    actual.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Nombre
                <input
                  value={form.nombre}
                  onChange={(event) => updateForm("nombre", event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Tu nombre"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Correo
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-slate-400"
                    placeholder="nombre@correo.com"
                    type="email"
                  />
                </div>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Profesion actual
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.profesion_actual}
                    onChange={(event) =>
                      updateForm("profesion_actual", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-slate-400"
                    placeholder="Ej: administrativa, enfermero, vendedor"
                  />
                </div>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Edad
                <input
                  value={form.edad}
                  onChange={(event) => updateForm("edad", event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Ej: 34"
                  type="number"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Pais
                <input
                  value={form.pais}
                  onChange={(event) => updateForm("pais", event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Ciudad
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.ciudad}
                    onChange={(event) =>
                      updateForm("ciudad", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-slate-400"
                    placeholder="Ej: Santiago"
                  />
                </div>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Nivel educativo
                <input
                  value={form.nivel_educativo}
                  onChange={(event) =>
                    updateForm("nivel_educativo", event.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Ej: tecnico, universitario, media completa"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Ingreso actual aproximado
                <input
                  value={form.ingreso_actual_aprox}
                  onChange={(event) =>
                    updateForm("ingreso_actual_aprox", event.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Ej: 850000"
                  type="number"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Nivel de ingles
                <select
                  value={form.nivel_ingles}
                  onChange={(event) =>
                    updateForm("nivel_ingles", event.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">Selecciona</option>
                  <option value="Nulo">Nulo</option>
                  <option value="Basico">Basico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Situacion actual
                <select
                  value={form.situacion_actual}
                  onChange={(event) =>
                    updateForm("situacion_actual", event.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">Selecciona</option>
                  <option value="empleado">Empleado/a</option>
                  <option value="independiente">Independiente</option>
                  <option value="desempleado">Desempleado/a</option>
                  <option value="en_transicion">En transicion</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Disponibilidad para estudiar
                <select
                  value={form.disponibilidad_para_estudiar}
                  onChange={(event) =>
                    updateForm(
                      "disponibilidad_para_estudiar",
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">Selecciona</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                Disponibilidad para relocalizarse
                <select
                  value={form.disponibilidad_para_relocalizarse}
                  onChange={(event) =>
                    updateForm(
                      "disponibilidad_para_relocalizarse",
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">Selecciona</option>
                  <option value="ninguna">Ninguna</option>
                  <option value="regional">Solo dentro del pais</option>
                  <option value="internacional">Tambien internacional</option>
                </select>
              </label>

              <div className="md:col-span-2 flex justify-end pt-2">
                <Button
                  onClick={handleCreateSession}
                  disabled={!isPhaseZeroValid || loading}
                  className="min-w-48"
                >
                  {loading ? <Spinner size="sm" /> : "Comenzar fase 1"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "phase_1" && session && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white/95 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                      Fase 1
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Test base de reconversion
                    </h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {currentQuestionIndex + 1} / {reconversionQuestions.length}
                  </div>
                </div>
                <ProgressBar
                  value={questionProgress}
                  showLabel={false}
                  color="bg-slate-900"
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {reconversionDimensionLabels[currentQuestion.dimension] ??
                      currentQuestion.dimension}
                  </div>
                  <div className="text-sm text-slate-500">
                    Respondidas: {answeredCount}
                  </div>
                </div>
                <CardTitle className="text-2xl leading-9">
                  {currentQuestion.text}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {scaleOptions.map((option) => {
                  const selected = answers[currentQuestion.id] === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [currentQuestion.id]: option.value,
                        }))
                      }
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{option.label}</span>
                        <span
                          className={`text-sm ${selected ? "text-slate-200" : "text-slate-400"}`}
                        >
                          {option.value}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                disabled={currentQuestionIndex === 0 || loading}
                onClick={() =>
                  setCurrentQuestionIndex((value) => Math.max(0, value - 1))
                }
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentQuestionIndex < reconversionQuestions.length - 1 ? (
                <Button
                  disabled={!answers[currentQuestion.id] || loading}
                  onClick={() =>
                    setCurrentQuestionIndex((value) =>
                      Math.min(reconversionQuestions.length - 1, value + 1),
                    )
                  }
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  disabled={
                    answeredCount !== reconversionQuestions.length || loading
                  }
                  onClick={handleSubmitPhaseOne}
                >
                  {loading ? <Spinner size="sm" /> : "Guardar fase 1"}
                </Button>
              )}
            </div>
          </div>
        )}

        {stage === "phase_2" && session && phaseSummary && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white/95 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                      Fase 2
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Desafio intencional de energia laboral
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                      Ahora vamos a observar que tipo de situaciones te activan,
                      te dejan neutro o te drenan.
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {currentScenarioIndex + 1} /{" "}
                    {reconversionPhaseTwoScenarios.length}
                  </div>
                </div>
                <ProgressBar
                  value={phaseTwoProgress}
                  showLabel={false}
                  color="bg-amber-600"
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
                    {reconversionPhaseTwoLabels[currentScenario.dimension]}
                  </div>
                  <div className="text-sm text-slate-500">
                    Respondidas: {phaseTwoAnsweredCount}
                  </div>
                </div>
                <CardTitle className="text-2xl leading-9">
                  {currentScenario.title}
                </CardTitle>
                <p className="text-base leading-7 text-slate-600">
                  {currentScenario.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-3">
                {[
                  {
                    value: "energiza" as const,
                    title: "Me energiza",
                    description:
                      "Esto me haria sentir mas vivo/a y con buena disposicion.",
                    className:
                      "border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-500",
                    selectedClassName:
                      "border-emerald-700 bg-emerald-700 text-white",
                  },
                  {
                    value: "neutral" as const,
                    title: "Me da igual",
                    description: "Puedo hacerlo, pero no me mueve demasiado.",
                    className:
                      "border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-500",
                    selectedClassName:
                      "border-slate-800 bg-slate-800 text-white",
                  },
                  {
                    value: "drena" as const,
                    title: "Me drena",
                    description:
                      "Esto probablemente me desgasta o me apaga con el tiempo.",
                    className:
                      "border-rose-300 bg-rose-50 text-rose-900 hover:border-rose-500",
                    selectedClassName: "border-rose-700 bg-rose-700 text-white",
                  },
                ].map((option) => {
                  const selected =
                    phaseTwoAnswers[currentScenario.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setPhaseTwoAnswers((current) => ({
                          ...current,
                          [currentScenario.id]: option.value,
                        }))
                      }
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        selected ? option.selectedClassName : option.className
                      }`}
                    >
                      <p className="font-semibold">{option.title}</p>
                      <p
                        className={`mt-1 text-sm ${selected ? "text-white/85" : "opacity-80"}`}
                      >
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                disabled={currentScenarioIndex === 0 || loading}
                onClick={() =>
                  setCurrentScenarioIndex((value) => Math.max(0, value - 1))
                }
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentScenarioIndex <
              reconversionPhaseTwoScenarios.length - 1 ? (
                <Button
                  disabled={!phaseTwoAnswers[currentScenario.id] || loading}
                  onClick={() =>
                    setCurrentScenarioIndex((value) =>
                      Math.min(
                        reconversionPhaseTwoScenarios.length - 1,
                        value + 1,
                      ),
                    )
                  }
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  disabled={
                    phaseTwoAnsweredCount !==
                      reconversionPhaseTwoScenarios.length || loading
                  }
                  onClick={handleSubmitPhaseTwo}
                >
                  {loading ? <Spinner size="sm" /> : "Guardar fase 2"}
                </Button>
              )}
            </div>
          </div>
        )}

        {stage === "phase_3" && session && phaseSummary && phaseTwoSummary && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white/95 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                      Fase 3
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Test confirmatorio de direccion vocacional
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                      Esta fase comprueba si las señales del test base y del
                      desafio de energia se sostienen cuando te pedimos tomar
                      posicion frente a un cambio mas concreto.
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {currentConfirmQuestionIndex + 1} /{" "}
                    {reconversionPhaseThreeQuestions.length}
                  </div>
                </div>
                <ProgressBar
                  value={phaseThreeProgress}
                  showLabel={false}
                  color="bg-violet-600"
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-900">
                    {
                      reconversionPhaseThreeLabels[
                        currentConfirmQuestion.dimension
                      ]
                    }
                  </div>
                  <div className="text-sm text-slate-500">
                    Respondidas: {phaseThreeAnsweredCount}
                  </div>
                </div>
                <CardTitle className="text-2xl leading-9">
                  {currentConfirmQuestion.text}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {scaleOptions.map((option) => {
                  const selected =
                    phaseThreeAnswers[currentConfirmQuestion.id] ===
                    option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setPhaseThreeAnswers((current) => ({
                          ...current,
                          [currentConfirmQuestion.id]: option.value,
                        }))
                      }
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-violet-700 bg-violet-700 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{option.label}</span>
                        <span
                          className={`text-sm ${selected ? "text-violet-100" : "text-slate-400"}`}
                        >
                          {option.value}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                disabled={currentConfirmQuestionIndex === 0 || loading}
                onClick={() =>
                  setCurrentConfirmQuestionIndex((value) =>
                    Math.max(0, value - 1),
                  )
                }
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentConfirmQuestionIndex <
              reconversionPhaseThreeQuestions.length - 1 ? (
                <Button
                  disabled={
                    !phaseThreeAnswers[currentConfirmQuestion.id] || loading
                  }
                  onClick={() =>
                    setCurrentConfirmQuestionIndex((value) =>
                      Math.min(
                        reconversionPhaseThreeQuestions.length - 1,
                        value + 1,
                      ),
                    )
                  }
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  disabled={
                    phaseThreeAnsweredCount !==
                      reconversionPhaseThreeQuestions.length || loading
                  }
                  onClick={handleSubmitPhaseThree}
                >
                  {loading ? <Spinner size="sm" /> : "Guardar fase 3"}
                </Button>
              )}
            </div>
          </div>
        )}

        {stage === "phase_4" &&
          session &&
          phaseSummary &&
          phaseTwoSummary &&
          phaseThreeSummary && (
            <div className="space-y-6">
              <Card className="border-slate-200 bg-white/95 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                        Fase 4
                      </p>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Simulador de trade-offs de reconversion
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-slate-500">
                        Aqui ya no medimos solo afinidad. Te pedimos elegir
                        entre costos reales del cambio para entender como se
                        podria sostener una reconversion posible para tu vida.
                      </p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                      {currentTradeoffIndex + 1} /{" "}
                      {reconversionPhaseFourScenarios.length}
                    </div>
                  </div>
                  <ProgressBar
                    value={phaseFourProgress}
                    showLabel={false}
                    color="bg-cyan-700"
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-900">
                      {currentTradeoff.theme}
                    </div>
                    <div className="text-sm text-slate-500">
                      Respondidas: {phaseFourAnsweredCount}
                    </div>
                  </div>
                  <CardTitle className="text-2xl leading-9">
                    {currentTradeoff.title}
                  </CardTitle>
                  <p className="text-base leading-7 text-slate-600">
                    {currentTradeoff.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {currentTradeoff.options.map((option) => {
                    const selected =
                      phaseFourAnswers[currentTradeoff.id] === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          setPhaseFourAnswers((current) => ({
                            ...current,
                            [currentTradeoff.id]: option.value,
                          }))
                        }
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          selected
                            ? "border-cyan-700 bg-cyan-700 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
                        }`}
                      >
                        <p className="font-semibold">{option.title}</p>
                        <p
                          className={`mt-1 text-sm ${
                            selected ? "text-cyan-50" : "text-slate-500"
                          }`}
                        >
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  disabled={currentTradeoffIndex === 0 || loading}
                  onClick={() =>
                    setCurrentTradeoffIndex((value) => Math.max(0, value - 1))
                  }
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>

                {currentTradeoffIndex <
                reconversionPhaseFourScenarios.length - 1 ? (
                  <Button
                    disabled={!phaseFourAnswers[currentTradeoff.id] || loading}
                    onClick={() =>
                      setCurrentTradeoffIndex((value) =>
                        Math.min(
                          reconversionPhaseFourScenarios.length - 1,
                          value + 1,
                        ),
                      )
                    }
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    disabled={
                      phaseFourAnsweredCount !==
                        reconversionPhaseFourScenarios.length || loading
                    }
                    onClick={handleSubmitPhaseFour}
                  >
                    {loading ? <Spinner size="sm" /> : "Guardar fase 4"}
                  </Button>
                )}
              </div>
            </div>
          )}

        {stage === "done" &&
          phaseSummary &&
          phaseTwoSummary &&
          phaseThreeSummary &&
          phaseFourSummary &&
          session && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Tu primera lectura de reconversion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-700">
                  <p className="text-base leading-7">
                    {phaseSummary.profile_summary}
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    {phaseSummary.consistency_hint}
                  </p>

                  <div className="grid gap-3">
                    {phaseSummary.top_dimensions.map((dimension) => (
                      <div
                        key={dimension}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {reconversionDimensionLabels[dimension] ?? dimension}
                        </p>
                        <p className="text-sm text-slate-500">
                          Puntaje base:{" "}
                          {phaseSummary.dimension_scores[dimension] ?? 0} / 100
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <div className="mb-3 flex items-center gap-2 text-amber-900">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-sm font-semibold">
                        Lectura del desafio de energia
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-amber-950">
                      {phaseTwoSummary.challenge_readout}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-amber-900">
                      {phaseTwoSummary.transition_signal}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4">
                    <p className="text-sm font-semibold text-violet-950">
                      Confirmacion de fase 3
                    </p>
                    <p className="mt-2 text-sm leading-6 text-violet-950">
                      {phaseThreeSummary.confirmation_readout}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {phaseThreeSummary.confirmed_signals.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-900"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4">
                    <p className="text-sm font-semibold text-cyan-950">
                      Lectura del desafio de trade-offs
                    </p>
                    <p className="mt-2 text-sm leading-6 text-cyan-950">
                      {phaseFourSummary.decision_summary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {phaseFourSummary.tradeoff_profile.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-900"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Lo que ya sabemos de ti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                    <p className="font-semibold">Te energiza</p>
                    <p className="mt-1">
                      {phaseTwoSummary.energy_map.length > 0
                        ? phaseTwoSummary.energy_map.join(", ")
                        : "Aun no aparece una fuente dominante de energia."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                    <p className="font-semibold">Te drena</p>
                    <p className="mt-1">
                      {phaseTwoSummary.drain_map.length > 0
                        ? phaseTwoSummary.drain_map.join(", ")
                        : "No se detecta drenaje fuerte por ahora."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                    <p className="font-semibold">
                      Modos de trabajo compatibles
                    </p>
                    <p className="mt-1">
                      {phaseTwoSummary.dominant_work_modes.join(", ")}.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-950">
                    <p className="font-semibold">
                      Confianza de la hipotesis actual
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {phaseThreeSummary.confidence_score} / 100
                    </p>
                    <p className="mt-1 text-sm">
                      Nivel {phaseThreeSummary.confidence_label}. Esto nos dice
                      cuan consistente se ve tu direccion potencial antes de
                      pasar al desafio final y al informe IA.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                    <p className="font-semibold">Senales a mirar con cuidado</p>
                    <p className="mt-1">
                      {phaseThreeSummary.tension_signals.length > 0
                        ? phaseThreeSummary.tension_signals.join(", ")
                        : "No aparecen tensiones fuertes en esta etapa."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-950">
                    <p className="font-semibold">Readiness de cambio</p>
                    <p className="mt-1 text-2xl font-bold">
                      {phaseFourSummary.change_readiness} / 100
                    </p>
                    <p className="mt-1 text-sm">
                      Movilidad{" "}
                      {phaseFourSummary.mobility_readiness.toLowerCase()} y
                      aprendizaje{" "}
                      {phaseFourSummary.upskilling_readiness.toLowerCase()}.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                    <p className="font-semibold">
                      Modalidad y tension economica
                    </p>
                    <p className="mt-1">
                      {phaseFourSummary.preferred_work_setup}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {phaseFourSummary.income_tension}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                    <p className="font-semibold">Condiciones a respetar</p>
                    <p className="mt-1">
                      {phaseFourSummary.constraints_to_respect.join(" ")}
                    </p>
                  </div>
                  <p>
                    El siguiente corte natural es generar el informe IA usando
                    estas cuatro capas para proponer rutas concretas de
                    reconversion, fricciones y balance entre bienestar e
                    ingreso.
                  </p>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="font-semibold text-slate-900">
                      Informe final
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Genera una vista pública con rutas recomendadas, gráfico
                      de bienestar vs ingreso y plan de acción.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {!reportUrl ? (
                        <Button
                          onClick={handleGenerateReport}
                          disabled={loading}
                        >
                          {loading ? (
                            <Spinner size="sm" />
                          ) : (
                            "Generar informe final"
                          )}
                        </Button>
                      ) : (
                        <a href={reportUrl} className="inline-flex">
                          <Button>Abrir informe público</Button>
                        </a>
                      )}
                    </div>
                    {reportUrl && (
                      <p className="mt-3 text-xs text-slate-400">
                        Informe generado
                        {reportGeneratedAt ? `: ${reportGeneratedAt}` : ""}.
                        URL: {reportUrl}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Session ID: {session.id}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
      </main>
    </div>
  );
}
