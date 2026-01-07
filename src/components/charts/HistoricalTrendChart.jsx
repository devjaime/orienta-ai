import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, TrendingDown, Info } from 'lucide-react';
import {
  hasHistoricalData,
  loadAllHistoricalData,
  prepareHistoricalChartData,
  calculateYearComparison
} from '../../lib/historicalDataManager';

/**
 * Componente para mostrar tendencias históricas cuando hay datos de múltiples años
 */
export default function HistoricalTrendChart({ careerName }) {
  const [historicalData, setHistoricalData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [careerName]);

  async function loadData() {
    setLoading(true);

    // Verificar si hay datos históricos disponibles
    if (!hasHistoricalData()) {
      setLoading(false);
      return;
    }

    try {
      // Cargar todos los años
      const data = await loadAllHistoricalData();
      setHistoricalData(data);

      // Preparar datos para el gráfico
      const chartData = prepareHistoricalChartData(careerName, data);
      setChartData(chartData);

      // Calcular comparación
      const comparison = calculateYearComparison(careerName, data);
      setComparison(comparison);
    } catch (error) {
      console.error('Error cargando datos históricos:', error);
    } finally {
      setLoading(false);
    }
  }

  // Si no hay datos históricos (solo tenemos 2025), mostrar mensaje informativo
  if (!loading && !hasHistoricalData()) {
    return (
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              📊 Datos Históricos en Desarrollo
            </h4>
            <p className="text-sm text-blue-800 leading-relaxed mb-3">
              Actualmente contamos con datos de 2025. El sistema está preparado para incorporar
              datos de años anteriores (2024, 2023, etc.) cuando estén disponibles.
            </p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Con datos históricos podrás ver:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <span className="text-blue-600">•</span>
                Evolución de la matrícula año a año
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">•</span>
                Tendencias reales del mercado laboral
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">•</span>
                Predicciones más precisas basadas en histórico
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">•</span>
                Detección de ciclos y patrones estacionales
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos históricos...</span>
        </div>
      </div>
    );
  }

  if (!comparison || !comparison.available) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <p className="text-gray-600 text-center">
          No hay suficientes datos históricos para esta carrera
        </p>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (comparison.stats.trend === 'creciente') {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else if (comparison.stats.trend === 'decreciente') {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
    return <Clock className="w-5 h-5 text-yellow-600" />;
  };

  const getTrendColor = () => {
    if (comparison.stats.trend === 'creciente') return 'text-green-600';
    if (comparison.stats.trend === 'decreciente') return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Evolución Histórica</h3>
      </div>

      {/* Estadísticas Resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Período</p>
          <p className="text-lg font-bold text-gray-900">
            {comparison.stats.firstYear}-{comparison.stats.lastYear}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Crecimiento Total</p>
          <p className={`text-lg font-bold ${getTrendColor()}`}>
            {comparison.stats.totalGrowth}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Crecimiento Anual</p>
          <p className={`text-lg font-bold ${getTrendColor()}`}>
            {comparison.stats.avgAnnualGrowth}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Tendencia</p>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <p className={`text-sm font-bold capitalize ${getTrendColor()}`}>
              {comparison.stats.trend}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
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
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Matrícula"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
          />
          {chartData.some(d => d.Titulados) && (
            <Line
              type="monotone"
              dataKey="Titulados"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Análisis */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📈 Análisis de Tendencia</h4>
        <p className="text-sm text-blue-800 leading-relaxed">
          En el período {comparison.stats.firstYear}-{comparison.stats.lastYear}, la carrera muestra
          una tendencia <strong>{comparison.stats.trend}</strong> con un crecimiento promedio
          de <strong>{comparison.stats.avgAnnualGrowth}</strong> por año.
          La volatilidad es <strong>{comparison.stats.volatilityLevel}</strong> ({comparison.stats.volatility}),
          lo que indica {comparison.stats.volatilityLevel === 'baja' ? 'estabilidad' :
          comparison.stats.volatilityLevel === 'media' ? 'cambios moderados' :
          'fluctuaciones significativas'} en la demanda.
        </p>
      </div>
    </div>
  );
}
