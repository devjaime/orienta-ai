import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, Heart, CheckCircle } from 'lucide-react';
import { getCurrentUser, supabase } from '../lib/supabase';

function CompleteProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    edad: '',
    genero: '',
    motivaciones: ''
  });

  useEffect(() => {
    checkUserAndProfile();
  }, []);

  const checkUserAndProfile = async () => {
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        navigate('/test');
        return;
      }

      setUser(currentUser);

      // Verificar si ya completó el perfil
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (profile) {
        // Ya tiene perfil, ir al test
        navigate('/test');
      }
    } catch (err) {
      console.error('Error checking profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación
    if (!formData.edad || !formData.genero || !formData.motivaciones.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    const edad = parseInt(formData.edad);
    if (edad < 13 || edad > 120) {
      alert('Por favor ingresa una edad válida');
      return;
    }

    if (formData.motivaciones.trim().length < 10) {
      alert('Por favor escribe al menos 10 caracteres en tus motivaciones');
      return;
    }

    setSaving(true);

    try {
      // Guardar perfil en Supabase
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          user_email: user.email,
          nombre: user.user_metadata?.full_name || user.email,
          edad: edad,
          genero: formData.genero,
          motivaciones: formData.motivaciones.trim(),
          avatar_url: user.user_metadata?.avatar_url || null
        });

      if (error) throw error;

      // Redirigir al test
      navigate('/test');

    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Hubo un error al guardar tu perfil. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vocari-bg flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vocari-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-vocari-primary/10 rounded-full mb-4">
            <User size={48} className="text-vocari-primary" />
          </div>
          <h1 className="text-3xl font-bold text-vocari-dark mb-2">
            ¡Bienvenido/a, {user?.user_metadata?.full_name?.split(' ')[0] || 'estudiante'}!
          </h1>
          <p className="text-gray-600">
            Cuéntanos un poco más sobre ti para personalizar tu experiencia
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-6 shadow-sm">
          {/* Edad */}
          <div>
            <label className="flex items-center gap-2 text-vocari-dark font-medium mb-3">
              <Calendar size={20} className="text-vocari-primary" />
              ¿Cuántos años tienes?
            </label>
            <input
              type="number"
              name="edad"
              value={formData.edad}
              onChange={handleChange}
              min="13"
              max="120"
              placeholder="Ej: 25, 45, 50..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vocari-primary"
              required
            />
            <p className="text-xs text-gray-400 mt-2">Cualquier edad es válida para reinventarte</p>
          </div>

          {/* Género */}
          <div>
            <label className="flex items-center gap-2 text-vocari-dark font-medium mb-3">
              <User size={20} className="text-vocari-primary" />
              ¿Con qué género te identificas?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Mujer', 'Hombre', 'Otro', 'Prefiero no decir'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, genero: option }))}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.genero === option
                      ? 'border-vocari-primary bg-vocari-primary/10 text-vocari-dark'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Motivaciones */}
          <div>
            <label className="flex items-center gap-2 text-vocari-dark font-medium mb-3">
              <Heart size={20} className="text-vocari-primary" />
              ¿Qué te motiva en la vida?
            </label>
            <textarea
              name="motivaciones"
              value={formData.motivaciones}
              onChange={handleChange}
              placeholder="Ej: Me apasiona ayudar a los demás, quiero hacer un impacto positivo en mi comunidad, me encanta aprender cosas nuevas..."
              rows="4"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vocari-primary resize-none"
              required
            />
            <p className="text-xs text-gray-400 mt-2">
              Comparte tus sueños, pasiones o lo que te inspira (mínimo 10 caracteres)
            </p>
          </div>

          {/* Privacy note */}
          <div className="bg-vocari-primary/5 border border-vocari-primary/20 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              🔒 Tus datos son privados y solo se usan para mejorar tus recomendaciones vocacionales.
              Puedes actualizarlos en cualquier momento.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-vocari-primary text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Continuar al Test Vocacional
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Esto tomará solo 1 minuto • Paso 1 de 2
        </p>
      </motion.div>
    </div>
  );
}

export default CompleteProfile;
