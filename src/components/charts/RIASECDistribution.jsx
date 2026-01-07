import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Brain, Users, Lightbulb, Heart, TrendingUp, Briefcase } from 'lucide-react';

/**
 * Componente para mostrar distribución de carreras por código RIASEC
 */
export default function RIASECDistribution({ riasecData, mode = 'pie' }) {
  if (!riasecData || !riasecData.analisis_por_dimension) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de análisis RIASEC disponibles
      </div>
    );
  }

  const { analisis_por_dimension, perfiles_riasec } = riasecData;

  // Iconos por dimensión RIASEC
  const icons = {
    'R': Briefcase,
    'I': Brain,
    'A': Lightbulb,
    'S': Heart,
    'E': TrendingUp,
    'C': Users
  };

  // Colores por dimensión
  const colors = {
    'R': '#ef4444', // Rojo
    'I': '#3b82f6', // Azul
    'A': '#8b5cf6', // Púrpura
    'S': '#10b981', // Verde
    'E': '#f59e0b', // Ámbar
    'C': '#6b7280'  // Gris
  };

  // Preparar datos para gráficos
  const chartData = Object.entries(analisis_por_dimension)
    .map(([dim, data]) => ({
      dimension: dim,
      nombre: perfiles_riasec[dim].nombre,
      carreras: data.count || 0,
      matricula: data.total_matricula || 0,
      oportunidad: data.avg_oportunidad || 0,
      color: colors[dim]
    }))
    .filter(item => item.carreras > 0)
    .sort((a, b) => b.carreras - a.carreras);

  // Tooltip personalizado para pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.nombre}</p>
          <p className="text-sm text-gray-600 mt-1">
            Carreras: <span className="font-bold">{data.carreras}</span>
          </p>
          <p className="text-sm text-gray-600">
            Matrícula: <span className="font-bold">{data.matricula.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Oportunidad promedio: <span className="font-bold">{data.oportunidad}/100</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Renderizar label personalizado para pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (mode === 'pie') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distribución por Perfil Vocacional (RIASEC)
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Gráfico de pie */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="carreras"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda con detalles */}
          <div className="space-y-3">
            {chartData.map((item) => {
              const Icon = icons[item.dimension];
              return (
                <div
                  key={item.dimension}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">
                      {item.dimension} - {item.nombre}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {item.carreras} carrera{item.carreras !== 1 ? 's' : ''} •
                      Oportunidad: {item.oportunidad}/100
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Descripción */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">💡 ¿Qué es RIASEC?</span> Es un modelo de orientación
            vocacional que clasifica las carreras según 6 tipos de personalidad: Realista,
            Investigativo, Artístico, Social, Emprendedor y Convencional.
          </p>
        </div>
      </div>
    );
  }

  // Mode: bar chart - Índice de oportunidad por dimensión
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Índice de Oportunidad por Perfil Vocacional
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            width={120}
          />
          <Tooltip content={<CustomPieTooltip />} />
          <Bar dataKey="oportunidad" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Insights */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium">Mayor Oportunidad</p>
          <p className="text-lg font-bold text-green-900">
            {chartData[0]?.nombre || 'N/A'}
          </p>
          <p className="text-sm text-green-700">
            {chartData[0]?.oportunidad || 0}/100
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Más Carreras</p>
          <p className="text-lg font-bold text-blue-900">
            {chartData[0]?.nombre || 'N/A'}
          </p>
          <p className="text-sm text-blue-700">
            {chartData[0]?.carreras || 0} carreras
          </p>
        </div>
      </div>
    </div>
  );
}
