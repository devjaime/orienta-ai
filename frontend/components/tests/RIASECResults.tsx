"use client";

import { motion } from "framer-motion";
import { Award, ArrowRight, RotateCcw } from "lucide-react";
import { dimensionDescriptions } from "@/lib/data/riasec-questions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { RIASEC_COLORS } from "@/lib/utils/constants";
import type { RIASECDimension } from "@/lib/types/career";
import type { RIASECTestResult } from "./RIASECTest";

interface RIASECResultsProps {
  result: RIASECTestResult;
  onRetake: () => void;
  onExplore: () => void;
}

const certezaVariant: Record<string, "success" | "warning" | "info"> = {
  Alta: "success",
  Media: "warning",
  Exploratoria: "info",
};

const certezaDescription: Record<string, string> = {
  Alta: "Tu perfil muestra una clara definicion vocacional. Las dimensiones dominantes se distinguen con claridad.",
  Media: "Tu perfil esta bien definido, pero algunas dimensiones tienen puntajes cercanos. Esto es normal y abre mas opciones.",
  Exploratoria:
    "Tienes multiples intereses con puntajes similares. Esto indica un perfil versatil que se beneficiaria de exploracion adicional.",
};

export function RIASECResults({
  result,
  onRetake,
  onExplore,
}: RIASECResultsProps) {
  const top3 = result.ranking.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero: Codigo Holland */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full mb-6">
          <Award size={16} className="text-green-600" />
          <span className="text-green-700 text-sm font-semibold">
            Test Completado
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-vocari-text mb-3">
          Tu Codigo Holland es{" "}
          <span className="text-vocari-primary">
            {result.codigo_holland}
          </span>
        </h1>

        <p className="text-lg text-vocari-text-muted mb-4 max-w-xl mx-auto">
          {top3
            .map(
              (d) =>
                dimensionDescriptions[d.dimension as RIASECDimension].nombre,
            )
            .join(" + ")}
        </p>

        <Badge variant={certezaVariant[result.certeza]} dot>
          Certeza: {result.certeza}
        </Badge>

        <p className="text-sm text-vocari-text-muted mt-3 max-w-lg mx-auto">
          {certezaDescription[result.certeza]}
        </p>
      </motion.div>

      {/* Top 3 dimensiones */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {top3.map((dim, index) => {
          const desc =
            dimensionDescriptions[dim.dimension as RIASECDimension];
          const color = RIASEC_COLORS[dim.dimension];
          const maxScore = 30;
          const percentage = Math.round((dim.score / maxScore) * 100);

          return (
            <motion.div
              key={dim.dimension}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {dim.dimension}
                    </div>
                    <span className="text-sm text-vocari-text-muted font-medium">
                      #{index + 1}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-vocari-text mb-1">
                    {desc.nombre}
                  </h3>
                  <p className="text-sm text-vocari-text-muted mb-4">
                    {desc.descripcion}
                  </p>

                  {/* Barra de puntaje */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-vocari-text-muted">Puntaje</span>
                      <span className="font-bold text-vocari-text">
                        {dim.score}/{maxScore}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>

                  {/* Caracteristicas */}
                  <div className="flex flex-wrap gap-1.5">
                    {desc.caracteristicas.map((c) => (
                      <span
                        key={c}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-vocari-text-muted"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Todas las dimensiones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-10"
      >
        <h2 className="text-lg font-bold text-vocari-text mb-4">
          Puntajes completos
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-3">
              {result.ranking.map((dim) => {
                const desc =
                  dimensionDescriptions[dim.dimension as RIASECDimension];
                const color = RIASEC_COLORS[dim.dimension];
                const percentage = Math.round((dim.score / 30) * 100);

                return (
                  <div key={dim.dimension} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {dim.dimension}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-vocari-text">
                          {desc.nombre}
                        </span>
                        <span className="text-vocari-text-muted">
                          {dim.score}/30
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, delay: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ambientes sugeridos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-10"
      >
        <h2 className="text-lg font-bold text-vocari-text mb-4">
          Ambientes de trabajo ideales
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {top3.flatMap((dim) => {
                const desc =
                  dimensionDescriptions[dim.dimension as RIASECDimension];
                const color = RIASEC_COLORS[dim.dimension];
                return desc.ambientes.map((amb) => (
                  <span
                    key={`${dim.dimension}-${amb}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 border border-gray-200"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {amb}
                  </span>
                ));
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Acciones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button variant="primary" size="lg" onClick={onExplore} className="gap-2">
          Explorar Carreras Recomendadas
          <ArrowRight size={20} />
        </Button>
        <Button variant="ghost" onClick={onRetake} className="gap-2">
          <RotateCcw size={16} />
          Repetir Test
        </Button>
      </motion.div>
    </div>
  );
}
