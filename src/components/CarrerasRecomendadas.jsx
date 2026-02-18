import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  DollarSign,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Star,
  Building2,
  Briefcase
} from 'lucide-react';

/**
 * Componente para mostrar las carreras recomendadas
 * Muestra top 6 carreras con score de compatibilidad
 */
function CarrerasRecomendadas({ recomendaciones, codigoUsuario }) {
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [sortBy, setSortBy] = useState('compatibilidad'); // 'compatibilidad' | 'salario' | 'empleabilidad'

  // Ordenar recomendaciones según criterio
  const carrerasOrdenadas = useMemo(() => {
    const carreras = [...recomendaciones];

    switch (sortBy) {
      case 'salario':
        return carreras.sort((a, b) => b.salario_promedio_chile_clp - a.salario_promedio_chile_clp);
      case 'empleabilidad':
        const empleabilidadOrder = { 'Baja': 1, 'Media': 2, 'Alta': 3, 'Muy Alta': 4 };
        return carreras.sort((a, b) =>
          empleabilidadOrder[b.empleabilidad] - empleabilidadOrder[a.empleabilidad]
        );
      default:
        return carreras.sort((a, b) => b.compatibilidad_score - a.compatibilidad_score);
    }
  }, [recomendaciones, sortBy]);

  if (!recomendaciones || recomendaciones.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No se encontraron recomendaciones</p>
      </div>
    );
  }

  const toggleCarrera = (id) => {
    setSelectedCarrera(selectedCarrera === id ? null : id);
  };

  const getCompatibilidadColor = (score) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getCompatibilidadLabel = (score) => {
    if (score >= 75) return 'Excelente match';
    if (score >= 60) return 'Muy buena compatibilidad';
    if (score >= 40) return 'Buena compatibilidad';
    return 'Compatibilidad moderada';
  };

  const formatSalario = (salario) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(salario);
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Carreras Recomendadas para tu perfil {codigoUsuario}
        </h2>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orienta-blue"
        >
          <option value="compatibilidad">Por compatibilidad</option>
          <option value="salario">Por salario</option>
          <option value="empleabilidad">Por empleabilidad</option>
        </select>
      </div>

      {/* Grid de carreras */}
      <div className="grid gap-4">
        {carrerasOrdenadas.map((carrera, index) => (
          <motion.div
            key={carrera.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-xl overflow-hidden hover:border-orienta-blue/50 transition-all"
          >
            {/* Carrera header (siempre visible) */}
            <button
              onClick={() => toggleCarrera(carrera.id)}
              className="w-full p-6 text-left flex items-start gap-4 hover:bg-white/5 transition-colors"
            >
              {/* Ranking badge */}
              <div className="flex-shrink-0 w-12 h-12 bg-orienta-blue/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-orienta-blue">#{index + 1}</span>
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {carrera.nombre}
                    </h3>
                    <p className="text-sm text-white/60">{carrera.area}</p>
                  </div>

                  {/* Score de compatibilidad */}
                  <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-bold ${getCompatibilidadColor(carrera.compatibilidad_score)}`}>
                      {carrera.compatibilidad_score}%
                    </div>
                    <p className="text-xs text-white/60">
                      {getCompatibilidadLabel(carrera.compatibilidad_score)}
                    </p>
                  </div>
                </div>

                {/* Stats rápidos */}
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{carrera.duracion_anos} años</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    <span>Empleabilidad {carrera.empleabilidad}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} />
                    <span>{formatSalario(carrera.salario_promedio_chile_clp)}</span>
                  </div>
                </div>

                {/* Match explanation */}
                {carrera.match_explicacion && (
                  <p className="text-sm text-orienta-blue/80 mt-2 italic">
                    {carrera.match_explicacion}
                  </p>
                )}
              </div>

              {/* Expand icon */}
              <div className="flex-shrink-0 text-white/60">
                {selectedCarrera === carrera.id ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </button>

            {/* Detalles expandibles */}
            <AnimatePresence>
              {selectedCarrera === carrera.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/10"
                >
                  <div className="p-6 space-y-4">
                    {/* Descripción */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Descripción</h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {carrera.descripcion}
                      </p>
                    </div>

                    {/* Perfil ideal */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Perfil ideal</h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {carrera.perfil_ideal}
                      </p>
                    </div>

                    {/* Grid de detalles */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Universidades */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 size={16} className="text-orienta-blue" />
                          <h4 className="text-sm font-semibold text-white">
                            Universidades destacadas
                          </h4>
                        </div>
                        <ul className="space-y-1">
                          {carrera.universidades_destacadas.map((uni, idx) => (
                            <li key={idx} className="text-sm text-white/70 flex items-center gap-2">
                              <Star size={12} className="text-yellow-400" />
                              {uni}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Campos laborales */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase size={16} className="text-orienta-blue" />
                          <h4 className="text-sm font-semibold text-white">
                            Campos laborales
                          </h4>
                        </div>
                        <ul className="space-y-1">
                          {carrera.campos_laborales.map((campo, idx) => (
                            <li key={idx} className="text-sm text-white/70">
                              • {campo}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Código Holland */}
                    <div className="bg-orienta-blue/10 border border-orienta-blue/30 rounded-lg p-4">
                      <p className="text-sm text-white/80">
                        <strong>Perfil Holland de esta carrera:</strong>{' '}
                        <span className="font-mono text-orienta-blue font-bold">
                          {carrera.codigo_holland}
                        </span>
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        Tu perfil: <span className="font-mono">{codigoUsuario}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center text-sm text-white/60 mt-8">
        <p>
          Estas recomendaciones se basan en tu perfil RIASEC.
          Explora cada opción y considera tus intereses personales.
        </p>
      </div>
    </div>
  );
}

export default CarrerasRecomendadas;
