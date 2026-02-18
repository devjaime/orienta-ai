import { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles } from 'lucide-react';

/**
 * Componente para visualizar tendencias históricas y proyecciones futuras
 *
 * Props:
 * - carrera: Nombre de la carrera
 * - historicalData: Array de { año, valor }
 * - projections: Array de { año, valor, confianza, min, max }
 * - metric: 'matricula' | 'salario'
 * - showProjection: boolean
 */
function CareerTrendChart({
  carrera,
  historicalData = [],
  projections = [],
  metric = 'matricula',
  showProjection = true,
  compact = false
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Combinar datos históricos y proyecciones
  const combinedData = [
    ...historicalData.map(d => ({ ...d, type: 'real' })),
    ...projections.map(d => ({ ...d, type: 'proyeccion' }))
  ];

  // Calcular tendencia general
  const trend = calculateTrend(historicalData);

  // Formateador de valores
  const formatValue = (value) => {
    if (metric === 'salario') {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString();
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProjection = data.type === 'proyeccion';

      return (
        <div className="bg-orienta-dark/95 border border-white/20 rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">
            {data.año}
            {isProjection && (
              <span className="ml-2 text-xs text-purple-400">(Proyección)</span>
            )}
          </p>
          <p className="text-orienta-blue text-lg font-bold">
            {formatValue(data.valor)}
          </p>
          {isProjection && data.confianza && (
            <p className="text-xs text-white/60 mt-1">
              Confianza: {(data.confianza * 100).toFixed(0)}%
            </p>
          )}
          {isProjection && data.min && data.max && (
            <p className="text-xs text-white/60">
              Rango: {formatValue(data.min)} - {formatValue(data.max)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Trend indicator
  const TrendIndicator = () => {
    const Icon = trend.direction === 'up' ? TrendingUp :
                 trend.direction === 'down' ? TrendingDown : Minus;

    const color = trend.direction === 'up' ? 'text-green-400' :
                  trend.direction === 'down' ? 'text-red-400' : 'text-gray-400';

    return (
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon size={20} />
        <span className="text-sm font-semibold">
          {trend.direction === 'up' ? 'Creciente' :
           trend.direction === 'down' ? 'Decreciente' : 'Estable'}
        </span>
        <span className="text-xs text-white/60">
          {trend.rate > 0 ? '+' : ''}{trend.rate.toFixed(1)}%/año
        </span>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="w-full h-24">
        <ResponsiveContainer>
          <AreaChart data={combinedData}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#33B5E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#33B5E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="valor"
              stroke="#33B5E5"
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
            <XAxis dataKey="año" hide />
            <YAxis hide />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/20 rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">
            {metric === 'matricula' ? 'Evolución de Matrícula' : 'Proyección de Salarios'}
          </h3>
          <p className="text-sm text-white/60">{carrera}</p>
        </div>
        <TrendIndicator />
      </div>

      {/* Chart */}
      <div className="w-full h-80 mb-4">
        <ResponsiveContainer>
          <LineChart data={combinedData}>
            <defs>
              <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#33B5E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#33B5E5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

            <XAxis
              dataKey="año"
              stroke="rgba(255,255,255,0.6)"
              style={{ fontSize: '12px' }}
            />

            <YAxis
              stroke="rgba(255,255,255,0.6)"
              style={{ fontSize: '12px' }}
              tickFormatter={formatValue}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => (
                <span className="text-white/80 text-sm">{value}</span>
              )}
            />

            {/* Línea vertical separando real de proyección */}
            {showProjection && projections.length > 0 && (
              <ReferenceLine
                x={projections[0].año}
                stroke="rgba(255,255,255,0.3)"
                strokeDasharray="5 5"
                label={{
                  value: 'Proyección',
                  fill: 'rgba(255,255,255,0.6)',
                  fontSize: 12
                }}
              />
            )}

            {/* Línea de datos reales */}
            <Line
              type="monotone"
              dataKey="valor"
              data={historicalData}
              stroke="#33B5E5"
              strokeWidth={3}
              dot={{ fill: '#33B5E5', r: 4 }}
              activeDot={{ r: 6 }}
              name="Datos Reales"
            />

            {/* Línea de proyección */}
            {showProjection && (
              <Line
                type="monotone"
                dataKey="valor"
                data={projections}
                stroke="#A78BFA"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: '#A78BFA', r: 4 }}
                activeDot={{ r: 6 }}
                name="Proyección"
              />
            )}

            {/* Área de confianza (min-max) */}
            {showProjection && projections[0]?.min && (
              <Area
                type="monotone"
                dataKey="max"
                data={projections}
                fill="url(#projectionGradient)"
                stroke="none"
                fillOpacity={0.3}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <div>
          <p className="text-xs text-white/60 mb-1">Valor Actual</p>
          <p className="text-lg font-bold text-white">
            {formatValue(historicalData[historicalData.length - 1]?.valor || 0)}
          </p>
        </div>

        {showProjection && projections.length > 0 && (
          <>
            <div>
              <p className="text-xs text-white/60 mb-1 flex items-center gap-1">
                <Sparkles size={12} />
                Proyección 2030
              </p>
              <p className="text-lg font-bold text-purple-400">
                {formatValue(projections[projections.length - 1]?.valor || 0)}
              </p>
            </div>

            <div>
              <p className="text-xs text-white/60 mb-1">Crecimiento</p>
              <p className={`text-lg font-bold ${trend.direction === 'up' ? 'text-green-400' : trend.direction === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                {trend.direction === 'up' ? '+' : ''}{trend.totalGrowth.toFixed(1)}%
              </p>
            </div>
          </>
        )}
      </div>

      {/* Warning for low confidence */}
      {showProjection && projections.length > 0 && projections[projections.length - 1]?.confianza < 0.7 && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200">
            Proyección con confianza moderada ({(projections[projections.length - 1].confianza * 100).toFixed(0)}%).
            Los valores reales pueden variar significativamente.
          </p>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Calcula tendencia a partir de datos históricos
 */
function calculateTrend(data) {
  if (data.length < 2) {
    return { direction: 'stable', rate: 0, totalGrowth: 0 };
  }

  const first = data[0].valor;
  const last = data[data.length - 1].valor;
  const years = data.length - 1;

  const totalGrowth = ((last - first) / first) * 100;
  const annualRate = totalGrowth / years;

  const direction = annualRate > 2 ? 'up' : annualRate < -2 ? 'down' : 'stable';

  return {
    direction,
    rate: annualRate,
    totalGrowth
  };
}

export default CareerTrendChart;
