import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2, Save, Calendar } from 'lucide-react';
import { getOrientadorAvailability, saveOrientadorAvailability } from '../../lib/orientadorService';
import { getCurrentUser } from '../../lib/supabase';

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

function AvailabilityManager() {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    setLoading(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const data = await getOrientadorAvailability(currentUser.id);
      setAvailability(data);
    }
    setLoading(false);
  };

  const addSlot = () => {
    setAvailability([
      ...availability,
      {
        day_of_week: 1, // Lunes por defecto
        start_time: '09:00',
        end_time: '13:00',
        slot_duration_minutes: 30
      }
    ]);
  };

  const removeSlot = (index) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveOrientadorAvailability(user.id, availability);
      alert('Disponibilidad guardada exitosamente');
    } catch (error) {
      alert('Error guardando disponibilidad: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white">Cargando disponibilidad...</div>;
  }

  return (
    <div className="bg-white/5 border border-white/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-orienta-blue" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-white">Mi Disponibilidad</h2>
            <p className="text-white/60 text-sm">Configura tus horarios semanales</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={addSlot}
            className="flex items-center gap-2 px-4 py-2 bg-orienta-blue text-white rounded-lg hover:bg-orienta-blue/80 transition-colors"
          >
            <Plus size={18} />
            Agregar Horario
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {availability.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p>No has configurado tu disponibilidad aún</p>
          <p className="text-sm mt-2">Haz clic en "Agregar Horario" para empezar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {availability.map((slot, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 border border-white/20 rounded-lg p-4"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Día de la semana */}
                <div className="col-span-3">
                  <label className="block text-white/60 text-sm mb-1">Día</label>
                  <select
                    value={slot.day_of_week}
                    onChange={(e) => updateSlot(index, 'day_of_week', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white"
                  >
                    {DAYS.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>

                {/* Hora inicio */}
                <div className="col-span-3">
                  <label className="block text-white/60 text-sm mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white"
                  />
                </div>

                {/* Hora fin */}
                <div className="col-span-3">
                  <label className="block text-white/60 text-sm mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white"
                  />
                </div>

                {/* Duración slot */}
                <div className="col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Duración</label>
                  <select
                    value={slot.slot_duration_minutes}
                    onChange={(e) => updateSlot(index, 'slot_duration_minutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>

                {/* Botón eliminar */}
                <div className="col-span-1 flex items-end justify-center">
                  <button
                    onClick={() => removeSlot(index)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {availability.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Nota:</strong> Los estudiantes podrán agendar sesiones únicamente en estos horarios.
            Los slots se generarán automáticamente según la duración configurada.
          </p>
        </div>
      )}
    </div>
  );
}

export default AvailabilityManager;
