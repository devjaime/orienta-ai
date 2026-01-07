import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Componente para mostrar proyecciones de matrícula de una carrera
 */
export default function CareerProjectionChart({ carreraData, height = 300 }) {
  if (!carreraData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de proyección disponibles
      </div>
    );
  }

  const {
    nombre,
    datos_base_2025,
    proyecciones_matricula,
    resumen
  } = carreraData;

  // Preparar datos para el gráfico
  const chartData = [];

  // Punto actual (2025)
  chartData.push({
    año: 2025,
    matricula: datos_base_2025.matricula || 0,
    proyectada: datos_base_2025.matricula || 0,
    min: null,
    max: null,
    tipo: 'actual'
  });

  // Proyecciones futuras
  Object.entries(proyecciones_matricula || {}).forEach(([año, data]) => {
    chartData.push({
      año: parseInt(año),
      matricula: null, // No hay datos reales
      proyectada: data.matricula_proyectada,
      min: data.intervalo_minimo,
      max: data.intervalo_maximo,
      tipo: 'proyeccion'
    });
  });

  // Determinar icono de tendencia
  const getTrendIcon = () => {
    const growth = parseFloat(resumen.crecimiento_matricula_total);
    if (growth > 10) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (growth < -5) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-yellow-600" />;
  };

  const getTrendColor = () => {
    const growth = parseFloat(resumen.crecimiento_matricula_total);
    if (growth > 10) return 'text-green-600';
    if (growth < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.año}</p>
          {data.tipo === 'actual' ? (
            <p className="text-sm text-gray-600">
              Matrícula actual: <span className="font-bold">{data.matricula.toLocaleString()}</span>
            </p>
          ) : (
            <>
              <p className="text-sm text-blue-600">
                Proyectada: <span className="font-bold">{data.proyectada.toLocaleString()}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Rango: {data.min.toLocaleString()} - {data.max.toLocaleString()}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{nombre}</h3>
            <p className="text-sm text-gray-600 mt-1">Proyección de Matrícula 2025-2030</p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <div className="text-right">
              <p className={`text-lg font-bold ${getTrendColor()}`}>
                {resumen.crecimiento_matricula_total}
              </p>
              <p className="text-xs text-gray-500">Crecimiento proyectado</p>
            </div>
          </div>
        </div>

        {/* Estadísticas clave */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium">Matrícula 2025</p>
            <p className="text-lg font-bold text-blue-900">
              {(datos_base_2025.matricula || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium">Proyección 2030</p>
            <p className="text-lg font-bold text-purple-900">
              {chartData[chartData.length - 1].proyectada.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-medium">Confianza</p>
            <p className="text-lg font-bold text-gray-900">
              {(resumen.confianza * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorProyectada" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="año"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
          />

          {/* Área de incertidumbre */}
          <Area
            type="monotone"
            dataKey="max"
            stroke="none"
            fill="#dbeafe"
            fillOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="min"
            stroke="none"
            fill="#ffffff"
            fillOpacity={1}
          />

          {/* Línea de datos actuales */}
          <Line
            type="monotone"
            dataKey="matricula"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5 }}
            name="Matrícula Actual"
            connectNulls={false}
          />

          {/* Línea de proyección */}
          <Line
            type="monotone"
            dataKey="proyectada"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#3b82f6', r: 4 }}
            name="Proyección"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Footer con nota */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Nota:</span> Las proyecciones se basan en tendencias
          actuales del sector, factores de saturación y análisis de demanda del mercado laboral.
          El área sombreada representa el intervalo de confianza.
        </p>
      </div>
    </div>
  );
}
