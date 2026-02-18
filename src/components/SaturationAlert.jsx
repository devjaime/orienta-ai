import { AlertTriangle, TrendingDown, Info } from 'lucide-react';

/**
 * Componente de alerta de saturación para mostrar durante el test
 * Advierte al usuario sobre carreras con alta saturación
 */
export default function SaturationAlert({ careerName, saturationLevel, show, onDismiss }) {
  if (!show) return null;

  const getAlertConfig = () => {
    switch (saturationLevel) {
      case 'crítica':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/50',
          textColor: 'text-red-200',
          iconColor: 'text-red-400',
          title: '⚠️ Alta Saturación Proyectada',
          message: `${careerName} muestra una saturación crítica del mercado. Considera especializaciones de nicho o áreas emergentes dentro del campo.`
        };
      case 'alta':
        return {
          icon: TrendingDown,
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/50',
          textColor: 'text-yellow-200',
          iconColor: 'text-yellow-400',
          title: '⚡ Saturación Moderada',
          message: `${careerName} presenta saturación moderada. Es importante destacar con postgrados, certificaciones o experiencia práctica.`
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/50',
          textColor: 'text-blue-200',
          iconColor: 'text-blue-400',
          title: 'ℹ️ Información del Mercado',
          message: `${careerName} muestra perspectivas equilibradas en el mercado laboral.`
        };
    }
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-4`}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h4 className={`font-semibold ${config.textColor} mb-1`}>
              {config.title}
            </h4>
            <p className={`text-sm ${config.textColor} leading-relaxed`}>
              {config.message}
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`${config.textColor} hover:opacity-70 transition-opacity text-sm`}
            >
              ✕
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
