"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RIASECTest, RIASECResults } from "@/components/tests";
import type { RIASECTestResult } from "@/components/tests";
import { api } from "@/lib/api";

type PageState = "intro" | "test" | "results";

export default function TestRIASECPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("intro");
  const [result, setResult] = useState<RIASECTestResult | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStart = useCallback(() => {
    setPageState("test");
  }, []);

  const handleComplete = useCallback(
    async (testResult: RIASECTestResult) => {
      setResult(testResult);
      setPageState("results");

      // Intentar guardar en backend (no bloqueante)
      setSaving(true);
      try {
        await api.post("/api/v1/tests/riasec", {
          codigo_holland: testResult.codigo_holland,
          certeza: testResult.certeza,
          puntajes: testResult.puntajes,
          respuestas: testResult.respuestas,
          duracion_minutos: testResult.duracion_minutos,
        });
      } catch (error) {
        // No bloquear la UI si falla el guardado
        console.error("Error guardando resultado:", error);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const handleRetake = useCallback(() => {
    setResult(null);
    setPageState("intro");
  }, []);

  const handleExplore = useCallback(() => {
    router.push("/estudiante/carreras");
  }, [router]);

  // Pantalla de introduccion
  if (pageState === "intro") {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-aura-ink mb-4">
            Test Vocacional RIASEC
          </h1>
          <p className="text-aura-muted text-lg">
            Descubre tu perfil vocacional basado en el modelo Holland
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-aura-ink mb-4">
            Antes de comenzar
          </h2>
          <ul className="space-y-3 text-aura-muted">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-aura-primary/10 text-aura-primary text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <span>
                El test tiene <strong className="text-aura-ink">36 preguntas</strong> y
                toma aproximadamente 10-15 minutos.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-aura-primary/10 text-aura-primary text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <span>
                Responde con sinceridad segun tus <strong className="text-aura-ink">intereses reales</strong>,
                no lo que crees que otros esperan.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-aura-primary/10 text-aura-primary text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <span>
                No hay respuestas correctas o incorrectas. Cada respuesta contribuye
                a identificar tu <strong className="text-aura-ink">perfil vocacional</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-aura-primary/10 text-aura-primary text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                4
              </span>
              <span>
                Puedes navegar entre preguntas libremente. Solo necesitas
                responder todas para ver los resultados.
              </span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-8 py-4 bg-aura-primary text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all"
          >
            Comenzar Test
          </button>
        </div>
      </div>
    );
  }

  // Test en progreso
  if (pageState === "test") {
    return (
      <div className="py-6 px-4">
        <RIASECTest onComplete={handleComplete} />
      </div>
    );
  }

  // Resultados
  if (pageState === "results" && result) {
    return (
      <div className="py-8 px-4">
        <RIASECResults
          result={result}
          onRetake={handleRetake}
          onExplore={handleExplore}
        />
        {saving && (
          <p className="text-center text-sm text-aura-muted mt-6">
            Guardando resultado...
          </p>
        )}
      </div>
    );
  }

  return null;
}
