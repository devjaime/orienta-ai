"use client";

import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCLP } from "@/lib/utils/currency";

export interface WellbeingIncomePoint {
  ruta: string;
  felicidad: number;
  dinero: number;
}

interface WellbeingIncomeChartProps {
  data: WellbeingIncomePoint[];
  height?: number;
  className?: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: WellbeingIncomePoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{point.ruta}</p>
      <p className="text-sm text-slate-600">
        Bienestar estimado:{" "}
        <span className="font-semibold text-slate-900">
          {point.felicidad}/100
        </span>
      </p>
      <p className="text-sm text-slate-600">
        Ingreso estimado:{" "}
        <span className="font-semibold text-slate-900">
          {formatCLP(point.dinero)}
        </span>
      </p>
    </div>
  );
}

export function WellbeingIncomeChart({
  data,
  height = 320,
  className,
}: WellbeingIncomeChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 24, right: 24, bottom: 12, left: 12 }}>
          <CartesianGrid stroke="#dbe4f0" strokeDasharray="4 4" />
          <XAxis
            type="number"
            dataKey="dinero"
            domain={["dataMin - 120000", "dataMax + 120000"]}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value: number) =>
              `${Math.round(value / 1_000_000)}M`
            }
            name="Ingreso"
          />
          <YAxis
            type="number"
            dataKey="felicidad"
            domain={[40, 100]}
            tick={{ fill: "#64748b", fontSize: 12 }}
            name="Bienestar"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: "4 4" }}
          />
          <Scatter data={data} fill="#0f766e">
            <LabelList
              dataKey="ruta"
              position="top"
              fontSize={12}
              fill="#0f172a"
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="mt-3 text-xs text-slate-500">
        El eje horizontal muestra ingreso estimado mensual y el vertical el
        indice estimado de bienestar laboral.
      </p>
    </div>
  );
}
