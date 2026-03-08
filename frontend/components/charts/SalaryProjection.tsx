"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCLP } from "@/lib/utils/currency";

export interface SalaryDataPoint {
  year: number | string;
  salary: number;
  /** true si el dato es proyeccion, false si es dato real */
  isProjection?: boolean;
}

interface SalaryProjectionProps {
  /** Datos salariales (actual + proyectados) */
  data: SalaryDataPoint[];
  /** Altura del grafico (default 280) */
  height?: number;
  /** Color barra actual */
  actualColor?: string;
  /** Color barras proyectadas */
  projectedColor?: string;
  /** Clase CSS adicional */
  className?: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SalaryDataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-sm text-vocari-text">{data.year}</p>
      <p className="text-sm text-vocari-text-muted">
        Salario:{" "}
        <span className="font-bold">{formatCLP(data.salary)}</span>
      </p>
      <p className="text-xs text-vocari-text-muted mt-0.5">
        {data.isProjection ? "Proyeccion" : "Valor actual"}
      </p>
    </div>
  );
}

export function SalaryProjection({
  data,
  height = 280,
  actualColor = "#38a169",
  projectedColor = "#3182ce",
  className,
}: SalaryProjectionProps) {
  // Crecimiento total
  const first = data[0]?.salary ?? 0;
  const last = data[data.length - 1]?.salary ?? 0;
  const growth = first > 0 ? ((last - first) / first) * 100 : 0;

  return (
    <div className={className}>
      {/* Estadisticas rapidas */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium">Actual</p>
          <p className="text-sm md:text-base font-bold text-green-900">
            {formatCLP(first)}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium">Proyectado</p>
          <p className="text-sm md:text-base font-bold text-blue-900">
            {formatCLP(last)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-medium">Crecimiento</p>
          <p
            className={`text-sm md:text-base font-bold ${
              growth >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Grafico */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: 12 }}
            tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="salary" radius={[6, 6, 0, 0]} name="Salario">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isProjection ? projectedColor : actualColor}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Nota */}
      <p className="text-xs text-vocari-text-muted mt-3">
        Las proyecciones consideran inflacion promedio (3% anual) + crecimiento
        real del sector. Valores en pesos chilenos (CLP).
      </p>
    </div>
  );
}
