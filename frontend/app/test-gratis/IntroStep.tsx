"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import TestFlowVideoGate from "@/components/orientador/TestFlowVideoGate";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldCheck,
  Target,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

export function IntroStep(p: {
  leadName: string;
  leadEmail: string;
  leadError: string;
  setLeadName: (v: string) => void;
  setLeadEmail: (v: string) => void;
  startTest: () => void;
}) {
  const { leadName, leadEmail, leadError, setLeadName, setLeadEmail, startTest } = p;
  return (
      <div className="min-h-screen bg-gradient-to-br from-aura-primary/5 via-aura-surface to-aura-violet/5">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-aura-primary/10 text-aura-primary rounded-full px-4 py-2 text-sm font-medium mb-4">
              <ShieldCheck className="w-4 h-4" />
              Metodologia RIASEC + datos de MINEDUC/SIES
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-aura-ink mb-4">
              Test vocacional gratis para decidir con datos reales
            </h1>
            <p className="text-aura-muted text-lg max-w-3xl mx-auto">
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

          <Card className="mb-6 border-aura-teal/40 bg-aura-teal/5">
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-aura-ink">
                Confirma tus datos para personalizar recomendaciones y enviar seguimiento.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-aura-muted mb-1 inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Nombre
                  </span>
                  <input
                    value={leadName}
                    onChange={(event) => setLeadName(event.target.value)}
                    placeholder="Tu nombre"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-aura-ink bg-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-aura-muted mb-1 inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Correo
                  </span>
                  <input
                    value={leadEmail}
                    onChange={(event) => setLeadEmail(event.target.value)}
                    placeholder="tu@email.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-aura-ink bg-white"
                  />
                </label>
              </div>
              {leadError && <p className="text-sm text-red-700">{leadError}</p>}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="border-aura-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 text-aura-primary">
                  <Clock3 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Tiempo estimado</span>
                </div>
                <p className="text-2xl font-bold text-aura-ink">7-10 min</p>
                <p className="text-sm text-aura-muted">Cuestionario completo de 36 preguntas</p>
              </CardContent>
            </Card>

            <Card className="border-aura-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 text-aura-primary">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-semibold">Resultado principal</span>
                </div>
                <p className="text-2xl font-bold text-aura-ink">Codigo RIASEC</p>
                <p className="text-sm text-aura-muted">Tus 3 dimensiones dominantes</p>
              </CardContent>
            </Card>

            <Card className="border-aura-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 text-aura-primary">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Fuente de datos</span>
                </div>
                <p className="text-2xl font-bold text-aura-ink">MINEDUC/SIES</p>
                <p className="text-sm text-aura-muted">Mercado laboral chileno</p>
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
                <BarChart3 className="w-5 h-5 text-aura-primary mt-0.5" />
                <div>
                  <p className="font-medium text-aura-ink">Evaluacion completa y estructurada</p>
                  <p className="text-sm text-aura-muted">
                    36 preguntas del modelo RIASEC para perfilar tus intereses vocacionales.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-aura-primary mt-0.5" />
                <div>
                  <p className="font-medium text-aura-ink">Ranking de carreras compatibles</p>
                  <p className="text-sm text-aura-muted">
                    Compatibilidad estimada con tu perfil + razones de ajuste.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-aura-primary mt-0.5" />
                <div>
                  <p className="font-medium text-aura-ink">Indicadores de decision</p>
                  <p className="text-sm text-aura-muted">
                    Empleabilidad, rango salarial y saturacion para comparar opciones.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-aura-primary mt-0.5" />
                <div>
                  <p className="font-medium text-aura-ink">Acceso inmediato</p>
                  <p className="text-sm text-aura-muted">
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
