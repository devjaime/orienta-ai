import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Users, AlertTriangle, Sparkles, Search, GitCompare } from 'lucide-react';
import CareerProjectionChart from '../components/charts/CareerProjectionChart';
import SalaryProjectionChart from '../components/charts/SalaryProjectionChart';
import RIASECDistribution from '../components/charts/RIASECDistribution';
import CareerComparator from '../components/CareerComparator';

export default function Dashboard() {
  const [projectionsData, setProjectionsData] = useState(null);
  const [riasecData, setRIASECData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // all, recommended, saturated

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  async function loadAnalyticsData() {
    try {
      // Cargar datos de proyecciones
      const projectionsRes = await fetch('/data/processed/future-projections.json');
      const projectionsJson = await projectionsRes.json();
      setProjectionsData(projectionsJson);

      // Cargar datos RIASEC
      const riasecRes = await fetch('/data/processed/riasec-analysis.json');
      const riasecJson = await riasecRes.json();
      setRIASECData(riasecJson);

      // Cargar datos de tendencias
      const trendsRes = await fetch('/data/processed/trends-analysis.json');
      const trendsJson = await trendsRes.json();
      setTrendsData(trendsJson);

      // Seleccionar primera carrera por defecto
      const carreras = Object.values(projectionsJson.proyecciones || {});
      if (carreras.length > 0) {
        setSelectedCarrera(carreras[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos de análisis:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando análisis y proyecciones...</p>
        </div>
      </div>
    );
  }

  if (!projectionsData || !riasecData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos no disponibles</h2>
          <p className="text-gray-600 mb-4">
            Los archivos de análisis no se encontraron. Asegúrate de ejecutar los scripts de análisis primero.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-gray-800">
              npm run analytics-full
            </p>
          </div>
        </div>
      </div>
    );
  }

  const carreras = Object.values(projectionsData.proyecciones || {});

  // Filtrar carreras
  const filteredCarreras = carreras.filter(carrera => {
    // Filtro por búsqueda
    const matchesSearch = carrera.nombre.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por modo
    let matchesMode = true;
    if (filterMode === 'recommended') {
      matchesMode = carrera.recomendacion?.nivel === 'excelente' || carrera.recomendacion?.nivel === 'bueno';
    } else if (filterMode === 'saturated') {
      matchesMode = carrera.saturacion_futura?.nivel === 'alta' || carrera.saturacion_futura?.nivel === 'crítica';
    }

    return matchesSearch && matchesMode;
  });

  // Estadísticas generales
  const stats = {
    totalCarreras: carreras.length,
    recomendadas: carreras.filter(c => c.recomendacion?.nivel === 'excelente' || c.recomendacion?.nivel === 'bueno').length,
    saturadas: carreras.filter(c => c.saturacion_futura?.nivel === 'alta' || c.saturacion_futura?.nivel === 'crítica').length,
    altoCrecimiento: projectionsData.rankings?.mayor_crecimiento_matricula?.length || 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Dashboard de Análisis Vocacional</h1>
          </div>
          <p className="text-blue-100">
            Proyecciones y tendencias del mercado laboral chileno 2025-2030
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Carreras</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCarreras}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recomendadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.recomendadas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saturadas</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.saturadas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alto Crecimiento</p>
                <p className="text-2xl font-bold text-purple-600">{stats.altoCrecimiento}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distribución RIASEC */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <RIASECDistribution riasecData={riasecData} mode="pie" />
          <RIASECDistribution riasecData={riasecData} mode="bar" />
        </div>

        {/* Comparador de Carreras */}
        <div className="mb-8">
          <CareerComparator availableProjections={projectionsData?.proyecciones} />
        </div>

        {/* Selector de Carrera y Gráficos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Proyecciones Detalladas por Carrera
            </h2>

            {/* Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar carrera..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtros */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterMode('recommended')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterMode === 'recommended'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Recomendadas
                </button>
                <button
                  onClick={() => setFilterMode('saturated')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterMode === 'saturated'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Saturadas
                </button>
              </div>
            </div>

            {/* Lista de Carreras */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {filteredCarreras.map((carrera) => (
                <button
                  key={carrera.nombre}
                  onClick={() => setSelectedCarrera(carrera)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedCarrera?.nombre === carrera.nombre
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {carrera.nombre}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {carrera.recomendacion?.emoji} {carrera.recomendacion?.nivel}
                  </p>
                </button>
              ))}
            </div>

            {filteredCarreras.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron carreras que coincidan con los filtros
              </div>
            )}
          </div>

          {/* Gráficos de la carrera seleccionada */}
          {selectedCarrera && (
            <div className="space-y-6">
              <CareerProjectionChart carreraData={selectedCarrera} height={350} />
              <SalaryProjectionChart carreraData={selectedCarrera} height={300} />

              {/* Recomendaciones */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{selectedCarrera.recomendacion?.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Recomendación: {selectedCarrera.recomendacion?.nivel.toUpperCase()}
                    </h3>
                    <p className="text-gray-700 mb-4">
                      {selectedCarrera.recomendacion?.mensaje}
                    </p>
                    {selectedCarrera.recomendacion?.acciones && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Acciones recomendadas:</p>
                        <ul className="space-y-1">
                          {selectedCarrera.recomendacion.acciones.map((accion, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-blue-600 font-bold">•</span>
                              <span>{accion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rankings */}
        {projectionsData.rankings && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Mayor Crecimiento */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Top 10: Mayor Crecimiento Proyectado
              </h3>
              <div className="space-y-2">
                {projectionsData.rankings.mayor_crecimiento_matricula.slice(0, 10).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-600">{item.sector}</p>
                      </div>
                    </div>
                    <span className="text-green-600 font-bold">{item.crecimiento}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mayor Crecimiento Salarial */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Top 10: Mayor Crecimiento Salarial
              </h3>
              <div className="space-y-2">
                {projectionsData.rankings.mayor_crecimiento_salario.slice(0, 10).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-600">
                          2030: ${item.salario_2030.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-blue-600 font-bold">{item.crecimiento_real}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <p className="text-sm text-gray-600 text-center">
            <span className="font-semibold">Fuente de datos:</span> MINEDUC Datos Abiertos 2025 •
            Última actualización: {new Date(projectionsData.generado).toLocaleDateString('es-CL')}
          </p>
        </div>
      </div>
    </div>
  );
}
