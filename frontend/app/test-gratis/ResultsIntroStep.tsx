"use client";

import { Button } from "@/components/ui/Button";
import TestFlowVideoGate from "@/components/orientador/TestFlowVideoGate";
import { ArrowRight } from "lucide-react";

export function ResultsIntroStep(p: { goResults: () => void }) {
  const setStep = (s: string) => {
    if (s === "results") p.goResults();
  };
  return (
      <div className="min-h-screen bg-gradient-to-br from-aura-primary/5 via-aura-surface to-aura-violet/5">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-5">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-aura-ink mb-2">
              Revisemos tu resultado vocacional
            </h2>
            <p className="text-aura-muted">
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
