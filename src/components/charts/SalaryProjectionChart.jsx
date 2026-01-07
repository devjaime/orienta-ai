import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';

/**
 * Componente para mostrar proyecciones de salario
 */
export default function SalaryProjectionChart({ carreraData, height = 250 }) {
  if (!carreraData || !carreraData.proyecciones_salario) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de proyección salarial disponibles
      </div>
    );
  }

  const {
    nombre,
    datos_base_2025,
    proyecciones_salario,
    resumen
  } = carreraData;

  // Preparar datos para el gráfico
  const chartData = [];

  // Salario base 2025
  chartData.push({
    año: '2025',
    salario: datos_base_2025.salario_promedio,
    tipo: 'actual'
  });

  // Proyecciones futuras
  Object.entries(proyecciones_salario || {}).forEach(([año, data]) => {
    chartData.push({
      año: año,
      salario: data.salario_proyectado,
      crecimiento_real: data.crecimiento_real,
      tipo: 'proyeccion'
    });
  });

  // Colores para las barras
  const getBarColor = (entry) => {
    if (entry.tipo === 'actual') return '#10b981'; // Verde
    return '#3b82f6'; // Azul
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.año}</p>
          <p className="text-sm text-gray-600">
            Salario: <span className="font-bold">${data.salario.toLocaleString()}</span>
          </p>
          {data.crecimiento_real && (
            <p className="text-xs text-green-600 mt-1">
              Crecimiento real: {data.crecimiento_real}
            </p>
          )}
          {data.tipo === 'actual' && (
            <p className="text-xs text-gray-500 mt-1">Valor actual</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calcular crecimiento total
  const salarioInicial = datos_base_2025.salario_promedio;
  const salarioFinal = chartData[chartData.length - 1].salario;
  const crecimientoTotal = ((salarioFinal - salarioInicial) / salarioInicial * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Proyección Salarial</h4>
              <p className="text-sm text-gray-600">{nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">+{crecimientoTotal}%</p>
              <p className="text-xs text-gray-500">Crecimiento total</p>
            </div>
          </div>
        </div>

        {/* Estadísticas clave */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">Salario Actual (2025)</p>
            <p className="text-lg font-bold text-green-900">
              ${salarioInicial.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium">Proyección (2030)</p>
            <p className="text-lg font-bold text-blue-900">
              ${salarioFinal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="año"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            content={() => null} // Ocultar leyenda por defecto
          />
          <Bar
            dataKey="salario"
            radius={[8, 8, 0, 0]}
            name="Salario Promedio"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer con nota */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-yellow-800">
          <span className="font-semibold">💡 Nota:</span> Las proyecciones salariales consideran
          inflación promedio (3% anual) + crecimiento real basado en demanda del sector.
          Los valores son estimaciones en pesos chilenos (CLP).
        </p>
      </div>
    </div>
  );
}
