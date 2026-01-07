import { useState, useEffect } from 'react';
import { X, Plus, TrendingUp, DollarSign, Users, Briefcase, GraduationCap, AlertTriangle, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Componente para comparar 2-3 carreras lado a lado
 */
export default function CareerComparator({ availableProjections }) {
  const [selectedCareers, setSelectedCareers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const MAX_CAREERS = 3;

  // Carreras disponibles que no están seleccionadas
  const availableCareers = Object.keys(availableProjections || {}).filter(
    carrera => !selectedCareers.includes(carrera)
  );

  // Filtrar carreras por búsqueda
  const filteredCareers = availableCareers.filter(carrera =>
    carrera.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addCareer = (carrera) => {
    if (selectedCareers.length < MAX_CAREERS) {
      setSelectedCareers([...selectedCareers, carrera]);
      setSearchTerm('');
      setShowSearch(false);
    }
  };

  const removeCareer = (carrera) => {
    setSelectedCareers(selectedCareers.filter(c => c !== carrera));
  };

  // Preparar datos para gráfico comparativo de matrícula
  const prepareEnrollmentData = () => {
    const years = [2025, 2026, 2027, 2028, 2029, 2030];
    return years.map(year => {
      const dataPoint = { año: year };

      selectedCareers.forEach(carrera => {
        const proyeccion = availableProjections[carrera];
        if (year === 2025) {
          dataPoint[carrera] = proyeccion?.datos_base_2025?.matricula || 0;
        } else {
          dataPoint[carrera] = proyeccion?.proyecciones_matricula?.[year]?.matricula_proyectada || 0;
        }
      });

      return dataPoint;
    });
  };

  // Colores para las líneas
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!availableProjections) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Cargando datos de comparación...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Comparador de Carreras</h2>

      {/* Selector de carreras */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 mb-4">
          {selectedCareers.map((carrera, index) => (
            <div
              key={carrera}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2"
              style={{ borderColor: colors[index], backgroundColor: `${colors[index]}15` }}
            >
              <span className="font-semibold text-gray-900">{carrera}</span>
              <button
                onClick={() => removeCareer(carrera)}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {selectedCareers.length < MAX_CAREERS && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <Plus size={16} />
              Agregar carrera
            </button>
          )}
        </div>

        {/* Búsqueda de carreras */}
        {showSearch && (
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar carrera..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {searchTerm && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredCareers.length > 0 ? (
                  filteredCareers.map(carrera => (
                    <button
                      key={carrera}
                      onClick={() => addCareer(carrera)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      {carrera}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No se encontraron carreras</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedCareers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold mb-2">Selecciona carreras para comparar</p>
          <p className="text-sm">Puedes comparar hasta {MAX_CAREERS} carreras simultáneamente</p>
        </div>
      )}

      {selectedCareers.length > 0 && (
        <>
          {/* Gráfico Comparativo de Matrícula */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Proyección de Matrícula 2025-2030</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareEnrollmentData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="año" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip />
                <Legend />
                {selectedCareers.map((carrera, index) => (
                  <Line
                    key={carrera}
                    type="monotone"
                    dataKey={carrera}
                    stroke={colors[index]}
                    strokeWidth={2}
                    dot={{ fill: colors[index], r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla Comparativa */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Métrica</th>
                  {selectedCareers.map((carrera, index) => (
                    <th
                      key={carrera}
                      className="text-left py-3 px-4 font-semibold"
                      style={{ color: colors[index] }}
                    >
                      {carrera}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Índice de Oportunidad */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-gray-700">Índice de Oportunidad</span>
                    </div>
                  </td>
                  {selectedCareers.map(carrera => {
                    const proyeccion = availableProjections[carrera];
                    const index = proyeccion?.datos_base_2025?.oportunidad_index || 0;
                    return (
                      <td key={carrera} className="py-3 px-4">
                        <span className="font-bold text-purple-600">{index}/100</span>
                      </td>
                    );
                  })}
                </tr>

                {/* Crecimiento Proyectado */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-700">Crecimiento 2030</span>
                    </div>
                  </td>
                  {selectedCareers.map(carrera => {
                    const proyeccion = availableProjections[carrera];
                    const growth = proyeccion?.resumen?.crecimiento_matricula_total || '0%';
                    const growthNum = parseFloat(growth);
                    const color = growthNum > 10 ? 'text-green-600' : growthNum < 0 ? 'text-red-600' : 'text-yellow-600';
                    return (
                      <td key={carrera} className="py-3 px-4">
                        <span className={`font-bold ${color}`}>{growth}</span>
                      </td>
                    );
                  })}
                </tr>

                {/* Matrícula Actual */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-700">Matrícula 2025</span>
                    </div>
                  </td>
                  {selectedCareers.map(carrera => {
                    const proyeccion = availableProjections[carrera];
                    const matricula = proyeccion?.datos_base_2025?.matricula || 0;
                    return (
                      <td key={carrera} className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{matricula.toLocaleString()}</span>
                      </td>
                    );
                  })}
                </tr>

                {/* Salario 2030 */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-700">Salario 2030</span>
                    </div>
                  </td>
                  {selectedCareers.map(carrera => {
                    const proyeccion = availableProjections[carrera];
                    const salario = proyeccion?.proyecciones_salario?.[2030]?.salario_proyectado || 0;
                    return (
                      <td key={carrera} className="py-3 px-4">
                        <span className="font-semibold text-green-600">
                          ${(salario / 1000000).toFixed(1)}M
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Saturación */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-gray-700">Saturación 2030</span>
                    </div>
                  </td>
                  {selectedCareers.map(carrera => {
                    const proyeccion = availableProjections[carrera];
                    const saturacion = proyeccion?.saturacion_futura?.nivel || 'N/A';
                    const color = saturacion === 'crítica' ? 'text-red-600' : saturacion === 'alta' ? 'text-yellow-600' : 'text-green-600';
                    return (
                      <td key={carrera} className="py-3 px-4">
                        <span className={`font-semibold capitalize ${color}`}>{saturacion}</span>
                      </td>
                    );
                  })}
                </tr>

                {/* Recomendación */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-700">Recomendación</span>
                    </div>
                  </td>
                  {selectedCareers.map(carrera => {
                    const proyeccion = availableProjections[carrera];
                    const nivel = proyeccion?.recomendacion?.nivel || 'N/A';
                    const emoji = proyeccion?.recomendacion?.emoji || '';
                    const color =
                      nivel === 'excelente' ? 'text-green-600' :
                      nivel === 'bueno' ? 'text-blue-600' :
                      nivel === 'moderado' ? 'text-yellow-600' :
                      'text-red-600';
                    return (
                      <td key={carrera} className="py-3 px-4">
                        <span className={`font-semibold capitalize ${color}`}>
                          {emoji} {nivel}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Conclusiones */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Conclusiones de la Comparación</h4>
            <ul className="space-y-2 text-sm text-blue-900">
              {selectedCareers.length >= 2 && (() => {
                const projections = selectedCareers.map(c => ({
                  nombre: c,
                  ...availableProjections[c]
                }));

                // Carrera con mayor crecimiento
                const maxGrowth = projections.reduce((max, p) => {
                  const growth = parseFloat(p.resumen?.crecimiento_matricula_total || 0);
                  return growth > parseFloat(max.resumen?.crecimiento_matricula_total || 0) ? p : max;
                });

                // Carrera con mejor salario
                const maxSalary = projections.reduce((max, p) => {
                  const salary = p.proyecciones_salario?.[2030]?.salario_proyectado || 0;
                  return salary > (max.proyecciones_salario?.[2030]?.salario_proyectado || 0) ? p : max;
                });

                // Carrera con mayor oportunidad
                const maxOpp = projections.reduce((max, p) => {
                  const opp = p.datos_base_2025?.oportunidad_index || 0;
                  return opp > (max.datos_base_2025?.oportunidad_index || 0) ? p : max;
                });

                return (
                  <>
                    <li><strong>{maxGrowth.nombre}</strong> muestra el mayor crecimiento proyectado ({maxGrowth.resumen?.crecimiento_matricula_total})</li>
                    <li><strong>{maxSalary.nombre}</strong> tiene la mejor proyección salarial para 2030 (${(maxSalary.proyecciones_salario?.[2030]?.salario_proyectado / 1000000).toFixed(1)}M)</li>
                    <li><strong>{maxOpp.nombre}</strong> presenta el mayor índice de oportunidad actual ({maxOpp.datos_base_2025?.oportunidad_index}/100)</li>
                  </>
                );
              })()}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
