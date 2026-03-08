"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface TrendDataPoint {
  year: number | string;
  value: number;
  projected?: number;
  label?: string;
}

interface TrendLineChartProps {
  /** Datos historicos y proyectados */
  data: TrendDataPoint[];
  /** Etiqueta eje Y */
  yAxisLabel?: string;
  /** Formateador del valor Y */
  yAxisFormatter?: (value: number) => string;
  /** Titulo del grafico */
  title?: string;
  /** Altura (default 300) */
  height?: number;
  /** Color linea principal */
  lineColor?: string;
  /** Color linea proyectada */
  projectedColor?: string;
  /** Clase CSS adicional */
  className?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  yAxisFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
  yAxisFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = yAxisFormatter ?? ((v: number) => v.toLocaleString("es-CL"));

  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-sm text-vocari-text mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm text-vocari-text-muted">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color }}
          />
          {entry.dataKey === "value" ? "Actual" : "Proyectado"}:{" "}
          <span className="font-bold">{fmt(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function TrendLineChart({
  data,
  yAxisLabel,
  yAxisFormatter,
  height = 300,
  lineColor = "#1a365d",
  projectedColor = "#38b2ac",
  className,
}: TrendLineChartProps) {
  const fmt = yAxisFormatter ?? ((v: number) => v.toLocaleString("es-CL"));
  const hasProjected = data.some((d) => d.projected !== undefined);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: 12 }}
            tickFormatter={fmt}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: "#6b7280" },
                  }
                : undefined
            }
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <CustomTooltip
                active={active}
                payload={payload as Array<{ value: number; dataKey: string; color: string }>}
                label={String(label)}
                yAxisFormatter={yAxisFormatter}
              />
            )}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) =>
              value === "value" ? "Actual" : "Proyectado"
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={{ fill: lineColor, r: 4 }}
            name="value"
            connectNulls={false}
          />
          {hasProjected && (
            <Line
              type="monotone"
              dataKey="projected"
              stroke={projectedColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: projectedColor, r: 3 }}
              name="projected"
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
