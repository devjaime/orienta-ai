import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Calendar, X, Clock, Video } from 'lucide-react';
import { getAvailableTimeSlots } from '../lib/orientadorService';
import { createScheduledSessionWithAssignment } from '../lib/supabase';

/**
 * Botón para agendar sesión con orientador profesional
 * Versión integrada con sistema de disponibilidad y asignación automática
 */
function ScheduleButton({ className = '', variant = 'default' }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [userNotes, setUserNotes] = useState('');

  useEffect(() => {
    if (showModal) {
      loadAvailableSlots();
    }
  }, [showModal]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 14); // Próximas 2 semanas

    const slots = await getAvailableTimeSlots(
      today.toISOString().split('T')[0],
      nextWeek.toISOString().split('T')[0]
    );

    setAvailableSlots(slots);
    setLoading(false);
  };

  const handleSchedule = async () => {
    if (!selectedDate) {
      alert('Selecciona un horario');
      return;
    }

    setScheduling(true);
    try {
      await createScheduledSessionWithAssignment({
        scheduled_date: selectedDate,
        duration_minutes: 30,
        user_notes: userNotes,
        status: 'pending'
      });

      alert('Sesión agendada exitosamente. El orientador te contactará pronto.');
      setShowModal(false);
      setSelectedDate(null);
      setUserNotes('');

    } catch (error) {
      alert('Error agendando sesión: ' + error.message);
    } finally {
      setScheduling(false);
    }
  };

  // Agrupar slots por día
  const slotsByDay = availableSlots.reduce((acc, slot) => {
    const day = new Date(slot.slot_datetime).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  // Renderizar versión compact
  if (variant === 'compact') {
    return (
      <>
        <motion.button
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-2 bg-vocari-primary text-white rounded-lg hover:bg-vocari-light hover:shadow-lg transition-all ${className}`}
        >
          <Calendar size={18} />
          <span className="font-medium">Agendar Sesión</span>
        </motion.button>

        <ScheduleModal
          showModal={showModal}
          setShowModal={setShowModal}
          loading={loading}
          scheduling={scheduling}
          slotsByDay={slotsByDay}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          userNotes={userNotes}
          setUserNotes={setUserNotes}
          handleSchedule={handleSchedule}
        />
      </>
    );
  }

  // Renderizar versión default (grande)
  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative overflow-hidden bg-gradient-to-br from-vocari-primary via-vocari-light to-vocari-accent rounded-2xl p-6 shadow-2xl hover:shadow-vocari-primary/50 transition-all ${className}`}
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
            <div className="px-4 py-2 bg-white text-vocari-primary font-bold rounded-lg group-hover:bg-white/90 transition-colors">
              Agendar Ahora →
            </div>
          </div>
        </div>
      </motion.button>

      <ScheduleModal
        showModal={showModal}
        setShowModal={setShowModal}
        loading={loading}
        scheduling={scheduling}
        slotsByDay={slotsByDay}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        userNotes={userNotes}
        setUserNotes={setUserNotes}
        handleSchedule={handleSchedule}
      />
    </>
  );
}

/**
 * Modal de agendamiento de sesiones
 */
function ScheduleModal({
  showModal,
  setShowModal,
  loading,
  scheduling,
  slotsByDay,
  selectedDate,
  setSelectedDate,
  userNotes,
  setUserNotes,
  handleSchedule
}) {
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Agendar Sesión de Orientación</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vocari-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando horarios disponibles...</p>
              </div>
            ) : (
              <>
                {/* Horarios disponibles */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Selecciona un horario:</h3>

                  {Object.keys(slotsByDay).length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No hay horarios disponibles en las próximas 2 semanas.</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Los orientadores aún no han configurado su disponibilidad.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(slotsByDay).map(([day, slots]) => (
                        <div key={day}>
                          <p className="text-sm font-semibold text-gray-700 mb-2 capitalize">{day}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {slots.map(slot => (
                              <button
                                key={slot.slot_datetime}
                                onClick={() => setSelectedDate(slot.slot_datetime)}
                                className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                  selectedDate === slot.slot_datetime
                                    ? 'border-vocari-primary bg-purple-50'
                                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="font-semibold">
                                  {new Date(slot.slot_datetime).toLocaleTimeString('es-CL', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{slot.orientador_nombre}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notas del usuario */}
                <div className="mb-6">
                  <label className="block font-semibold text-gray-900 mb-2">
                    ¿Qué te gustaría discutir? (opcional)
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Ej: Quiero explorar opciones de ingeniería, tengo dudas sobre mis resultados del test..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vocari-primary focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSchedule}
                    disabled={!selectedDate || scheduling}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-vocari-primary to-vocari-accent text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scheduling ? 'Agendando...' : 'Confirmar Agendamiento'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ScheduleButton;
