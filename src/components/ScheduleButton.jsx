import { Calendar, Video, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Botón para agendar sesión con orientador profesional
 * Abre Google Calendar con evento pre-configurado de 30 minutos
 */
function ScheduleButton({ className = '', variant = 'default' }) {
  const handleSchedule = () => {
    // Configuración del evento de Google Calendar
    const eventDetails = {
      action: 'TEMPLATE',
      text: 'Sesión de Orientación Vocacional - OrientaIA',
      details: `Sesión personalizada de 30 minutos con un orientador profesional.

📋 En esta sesión:
• Análisis profundo de tus resultados del test RIASEC
• Recomendaciones personalizadas de carreras
• Resolución de dudas vocacionales
• Plan de acción para tu futuro profesional

📞 Incluye videollamada por Google Meet

Al confirmar tu asistencia, recibirás un email con el enlace de la videollamada.`,
      location: 'Google Meet (enlace se enviará por email)',
      // Duración: 30 minutos
      dates: '', // Se configura manualmente en Google Calendar
    };

    // Construir URL de Google Calendar
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams(eventDetails);
    const calendarUrl = `${baseUrl}?${params.toString()}`;

    // Abrir en nueva pestaña
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={handleSchedule}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all ${className}`}
      >
        <Calendar size={18} />
        <span className="font-medium">Agendar Sesión</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleSchedule}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/50 transition-all ${className}`}
    >
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      <div className="relative z-10">
        {/* Icono y título */}
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Calendar size={32} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">
              Agenda tu Sesión Personalizada
            </h3>
            <p className="text-white/80 text-sm">
              Con un orientador profesional certificado
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-white/90">
            <Clock size={16} />
            <span className="text-sm">30 minutos</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <Video size={16} />
            <span className="text-sm">Por Google Meet</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">
            Gratis por tiempo limitado
          </span>
          <div className="px-4 py-2 bg-white text-purple-600 font-bold rounded-lg group-hover:bg-white/90 transition-colors">
            Agendar Ahora →
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default ScheduleButton;
