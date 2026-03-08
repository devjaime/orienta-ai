"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { RIASEC_COLORS } from "@/lib/utils/constants";
import { RIASEC_LABELS } from "@/lib/types/career";
import type { RIASECScores, RIASECDimension } from "@/lib/types/career";

interface RIASECRadarProps {
  /** Puntajes RIASEC (6-30 por dimension) */
  scores: RIASECScores;
  /** Maximo por dimension (default 30) */
  maxScore?: number;
  /** Altura del grafico (default 300) */
  height?: number;
  /** Mostrar etiquetas de puntaje */
  showValues?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

interface ChartDataPoint {
  dimension: string;
  label: string;
  score: number;
  fullMark: number;
  fill: string;
}

const DIMENSIONS: RIASECDimension[] = ["R", "I", "A", "S", "E", "C"];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-sm text-vocari-text">{data.label}</p>
      <p className="text-sm text-vocari-text-muted">
        Puntaje:{" "}
        <span className="font-bold" style={{ color: data.fill }}>
          {data.score}
        </span>
        /{data.fullMark}
      </p>
    </div>
  );
}

export function RIASECRadar({
  scores,
  maxScore = 30,
  height = 300,
  className,
}: RIASECRadarProps) {
  const data: ChartDataPoint[] = DIMENSIONS.map((dim) => ({
    dimension: dim,
    label: RIASEC_LABELS[dim],
    score: scores[dim] ?? 0,
    fullMark: maxScore,
    fill: RIASEC_COLORS[dim],
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#4a5568" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, maxScore]}
            tick={{ fontSize: 10, fill: "#a0aec0" }}
            tickCount={4}
          />
          <Radar
            name="Puntaje"
            dataKey="score"
            stroke="#1a365d"
            fill="#1a365d"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
