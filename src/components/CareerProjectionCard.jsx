import { TrendingUp, TrendingDown, Minus, DollarSign, AlertTriangle, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Tarjeta compacta de proyecciones para mostrar en Resultados
 */
export default function CareerProjectionCard({ carrera, proyeccion }) {
  if (!proyeccion) {
    return null;
  }

  const {
    resumen,
    datos_base_2025,
    proyecciones_matricula,
    proyecciones_salario,
    saturacion_futura,
    recomendacion
  } = proyeccion;

  // Determinar icono de tendencia
  const getTrendIcon = () => {
    const growth = parseFloat(resumen.crecimiento_matricula_total);
    if (growth > 10) return <TrendingUp className="w-4 h-4" />;
    if (growth < -5) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    const growth = parseFloat(resumen.crecimiento_matricula_total);
    if (growth > 10) return 'text-green-500';
    if (growth < -5) return 'text-red-500';
    return 'text-yellow-500';
  };

  // Calcular cambio de salario
  const salario2025 = datos_base_2025.salario_promedio;
  const salario2030 = proyecciones_salario?.[2030]?.salario_proyectado;
  const cambioSalario = salario2030 && salario2025
    ? ((salario2030 - salario2025) / salario2025 * 100).toFixed(0)
    : null;

  // Determinar color de recomendación
  const getRecommendationColor = () => {
    switch (recomendacion?.nivel) {
      case 'excelente': return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'bueno': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'moderado': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'precaución': return 'bg-red-500/20 border-red-500/50 text-red-400';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  // Alertas de saturación
  const showSaturationAlert = saturacion_futura?.nivel === 'alta' || saturacion_futura?.nivel === 'crítica';

  return (
    <div className="bg-white/5 border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm mb-1">{carrera.nombre}</h4>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getRecommendationColor()}`}>
              {recomendacion?.emoji} {recomendacion?.nivel}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de saturación */}
      {showSaturationAlert && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200">
            <span className="font-semibold">Alta saturación proyectada.</span>{' '}
            {saturacion_futura.alerta}
          </p>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Crecimiento de matrícula */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            {getTrendIcon()}
            <span className="text-xs text-white/60">Crecimiento 2030</span>
          </div>
          <p className={`text-lg font-bold ${getTrendColor()}`}>
            {resumen.crecimiento_matricula_total}
          </p>
        </div>

        {/* Índice de oportunidad */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-white/60">Oportunidad</span>
          </div>
          <p className="text-lg font-bold text-purple-400">
            {datos_base_2025.oportunidad_index}/100
          </p>
        </div>

        {/* Salario proyectado */}
        {salario2030 && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/60">Salario 2030</span>
            </div>
            <p className="text-sm font-bold text-green-400">
              ${(salario2030 / 1000000).toFixed(1)}M
            </p>
            {cambioSalario && (
              <p className="text-xs text-white/60">+{cambioSalario}%</p>
            )}
          </div>
        )}

        {/* Matrícula actual */}
        {datos_base_2025.matricula && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">Matrícula 2025</span>
            </div>
            <p className="text-sm font-bold text-blue-400">
              {datos_base_2025.matricula.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Recomendación breve */}
      {recomendacion?.mensaje && (
        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <p className="text-xs text-white/80 leading-relaxed">
            {recomendacion.mensaje}
          </p>
        </div>
      )}

      {/* Link al dashboard */}
      <Link
        to={`/dashboard?carrera=${encodeURIComponent(carrera.nombre)}`}
        className="block w-full text-center px-3 py-2 bg-orienta-blue/20 border border-orienta-blue/50 text-orienta-blue rounded-lg hover:bg-orienta-blue/30 transition-all text-sm font-medium"
      >
        Ver análisis completo →
      </Link>
    </div>
  );
}
