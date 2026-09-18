"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import TestFlowVideoGate from "@/components/orientador/TestFlowVideoGate";
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Star,
} from "lucide-react";
import {
  splitReportText,
  surveyScale,
} from "./shared";
import { trackEvent } from "@/lib/utils/analytics";

export function ResultsFeedback(p: Record<string, any>) {
  const reportGenerated = p.reportGenerated as boolean;
  const reportGeneratedFor = p.reportGeneratedFor as string;
  const reportText = p.reportText as string;
  const reportError = p.reportError as string;
  const loading = p.loading as boolean;
  const loadingMessage = p.loadingMessage as string;
  const generateReport = p.generateReport as () => void;
  const surveySubmitted = p.surveySubmitted as boolean;
  const surveyClarity = p.surveyClarity as number | null;
  const surveyTrust = p.surveyTrust as number | null;
  const surveyRecommend = p.surveyRecommend as number | null;
  const surveyComment = p.surveyComment as string;
  const surveyLoading = p.surveyLoading as boolean;
  const surveyError = p.surveyError as string;
  const surveyComplete = p.surveyComplete as boolean;
  const setSurveyClarity = p.setSurveyClarity as (v: number) => void;
  const setSurveyTrust = p.setSurveyTrust as (v: number) => void;
  const setSurveyRecommend = p.setSurveyRecommend as (v: number) => void;
  const setSurveyComment = p.setSurveyComment as (v: string) => void;
  const submitSurvey = p.submitSurvey as () => void;
  const resetFlow = p.resetFlow as () => void;
  const leadName = (p.leadName as string) || "";
  const leadEmail = (p.leadEmail as string) || "";
  const leadId = (p.leadId as string | null) || null;


  return (
    <>
          <Card className="mb-8 border border-aura-primary/30 bg-gradient-to-r from-aura-primary/5 to-aura-surface">
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
                        <p className="text-sm whitespace-pre-line leading-relaxed text-aura-ink">
                          {beforeNextSteps}
                        </p>
                      </div>

                      {/* Próximos Pasos — bloqueados hasta completar encuesta */}
                      {nextSteps ? (
                        surveySubmitted ? (
                          /* Desbloqueado: mostrar próximos pasos */
                          <div className="bg-success/5 border border-success/20 rounded-lg p-4 mb-5 text-left">
                            <p className="text-sm whitespace-pre-line leading-relaxed text-aura-ink">
                              {nextSteps}
                            </p>
                          </div>
                        ) : (
                          /* Bloqueado: mostrar encuesta */
                          <div className="space-y-4 mb-5">
                            <div className="rounded-xl border border-aura-primary/40 bg-aura-primary/5 p-5 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-aura-primary/10 mb-3">
                                <MessageSquare className="w-6 h-6 text-aura-primary" />
                              </div>
                              <h3 className="text-lg font-bold text-aura-ink mb-1">
                                🔒 Próximos Pasos Recomendados
                              </h3>
                              <p className="text-aura-muted text-sm">
                                Para poder entregar tu reporte completo, favor completa esta breve encuesta.
                              </p>
                            </div>

                            <Card className="border border-gray-200">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                  <MessageSquare className="w-4 h-4 text-aura-primary" />
                                  Encuesta breve (30 segundos)
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-5">
                                <div>
                                  <p className="text-sm font-medium text-aura-ink mb-2">
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
                                  <p className="text-sm font-medium text-aura-ink mb-2">
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
                                  <p className="text-sm font-medium text-aura-ink mb-2">
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
                                  <label className="block text-sm font-medium text-aura-ink mb-2">
                                    Comentario opcional
                                  </label>
                                  <textarea
                                    value={surveyComment}
                                    onChange={(event) => setSurveyComment(event.target.value)}
                                    placeholder="¿Qué te gustaría mejorar?"
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-aura-ink"
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

                      {/* Confirmación post-encuesta + CTA informe profesional */}
                      {surveySubmitted && (
                        <div className="mb-6 space-y-4">
                          <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-success text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            Gracias por completar la encuesta. Tu feedback fue registrado.
                          </div>

                          <div className="rounded-xl border border-vocari-primary/20 bg-vocari-primary/5 p-5 text-center">
                            <h3 className="text-lg font-bold text-aura-ink mb-2">
                              ¿Quieres el informe profesional revisado por orientadores?
                            </h3>
                            <p className="text-sm text-aura-muted mb-4">
                              Obtén el PDF completo con datos MINEDUC, análisis RIASEC detallado y
                              revisión humana. Pago seguro con Flow.cl.
                            </p>
                            <Button
                              variant="primary"
                              className="w-full sm:w-auto"
                              onClick={() => {
                                const params = new URLSearchParams();
                                if (leadEmail.trim()) params.set("email", leadEmail.trim());
                                if (leadName.trim()) params.set("nombre", leadName.trim());
                                if (leadId) params.set("lead_id", leadId);
                                const qs = params.toString();
                                trackEvent("cta_informe_profesional_click", {
                                  page: "/test-gratis",
                                  has_email: Boolean(leadEmail.trim()),
                                  lead_id: leadId || undefined,
                                });
                                window.location.href = `https://vocari.cl/informes${qs ? `?${qs}` : ""}`;
                              }}
                            >
                              Obtener informe profesional
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="text-center">
                        <Button variant="secondary" onClick={generateReport} loading={loading}>
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
                  <p className="text-aura-muted mb-4">
                    Genera un reporte extendido con interpretación personalizada y siguientes pasos
                    para tu decisión vocacional.
                  </p>
                  {loading && loadingMessage && (
                    <p className="text-sm text-aura-muted mb-3">{loadingMessage}</p>
                  )}
                  {reportError && <p className="text-sm text-red-700 mb-3">{reportError}</p>}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      variant="primary"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (leadEmail.trim()) params.set("email", leadEmail.trim());
                        if (leadName.trim()) params.set("nombre", leadName.trim());
                        if (leadId) params.set("lead_id", leadId);
                        const qs = params.toString();
                        trackEvent("cta_informe_profesional_click", {
                          page: "/test-gratis",
                          source: "pre_ai_report",
                          has_email: Boolean(leadEmail.trim()),
                          lead_id: leadId || undefined,
                        });
                        window.location.href = `https://vocari.cl/informes${qs ? `?${qs}` : ""}`;
                      }}
                    >
                      Obtener informe profesional
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <Button variant="secondary" onClick={generateReport} loading={loading}>
                      Generar informe con IA
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
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

          
    </>
  );
}
