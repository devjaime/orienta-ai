"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  Briefcase,
  Lightbulb,
} from "lucide-react";
import type { RIASECDimension } from "@/lib/types/career";
import {
  type CareerRecommendation,
  dimensionAccentStyles,
  dimensionBadgeStyles,
  dimensionNames,
  formatSalary,
  getMineducYear,
  getSaturationLabel,
  getTopDimensions,
} from "./shared";

export function ResultsCareers(p: Record<string, any>) {
  const answers = p.answers as Record<number, number>;
  const topDims = getTopDimensions(answers);
  const hollandCode = p.hollandCode as string;
  const publicReportUrl = p.publicReportUrl as string | null;
  const copiedPublicUrl = p.copiedPublicUrl as boolean;
  const copyPublicUrl = p.copyPublicUrl as () => void;
  const loadingRecommendations = p.loadingRecommendations as boolean;
  const recommendations = p.recommendations as CareerRecommendation[];

  return (
    <>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-aura-primary/10 text-aura-primary rounded-full px-4 py-2 text-sm font-medium mb-3">
              <Lightbulb className="w-4 h-4" />
              Resultado vocacional personalizado
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-aura-ink mb-2">
              Tu perfil vocacional es {hollandCode}
            </h1>
            <p className="text-aura-muted max-w-3xl mx-auto">
              Esta recomendacion combina tus intereses (RIASEC) con indicadores del mercado chileno
              para ayudarte a priorizar carreras con mejor ajuste y proyeccion.
            </p>
          </div>

          {publicReportUrl && (
            <Card className="mb-8 border-aura-primary/30 bg-aura-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Enlace aparte del informe guardado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-aura-muted">
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
                  <p className="mt-3 text-2xl font-bold text-aura-ink">{score} pts</p>
                  <p className="text-sm text-aura-muted">Intensidad de interes detectada</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-8">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-aura-primary" />
              Carreras recomendadas con referencia MINEDUC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              {loadingRecommendations ? (
                <div className="rounded-xl border border-aura-primary/30 bg-aura-primary/5 p-6">
                  <div className="flex items-center gap-3">
                    <Spinner size="md" />
                    <div>
                      <p className="font-medium text-aura-ink">
                        Cruzando tu perfil con carreras del mercado chileno...
                      </p>
                      <p className="text-sm text-aura-muted">
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
                      className="border border-gray-200 rounded-xl p-4 hover:border-aura-primary/40 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-aura-ink">
                            {recommendation.career.name}
                          </h3>
                          <p className="text-sm text-aura-muted">{recommendation.career.area}</p>
                        </div>
                        <Badge className="bg-aura-primary text-white w-fit">
                          {Math.round(recommendation.match_score)}% compatibilidad
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-aura-muted text-xs mb-1">Ingreso estimado</p>
                          <p className="font-semibold text-aura-ink">
                            {formatSalary(recommendation.career.salary_range)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-aura-muted text-xs mb-1">Empleabilidad</p>
                          <p className="font-semibold text-green-700">
                            {Math.round(recommendation.career.employability * 100)}%
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-aura-muted text-xs mb-1">Saturacion</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${saturation.color}`}>
                            {saturation.label}
                          </span>
                        </div>
                      </div>

                      {recommendation.match_reasons.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-aura-muted mb-1">Motivo principal de ajuste</p>
                          <p className="text-sm text-aura-ink">{recommendation.match_reasons[0]}</p>
                        </div>
                      )}

                      <p className="mt-3 text-xs text-aura-muted">
                        Fuente: MINEDUC/SIES{sourceYear ? ` (${sourceYear})` : ""}.
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-aura-muted py-6">
                  No se encontraron recomendaciones en este intento. Puedes repetir el test.
                </p>
              )}
            </CardContent>
          </Card>
    </>
  );
}
