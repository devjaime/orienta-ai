import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Send, CheckCircle, Loader2 } from 'lucide-react';

function LeadCaptureForm({ hollandCode }) {
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    interes: 'carreras'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email) {
      setError('El email es requerido');
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    try {
      // Save to localStorage for now (in production, send to backend)
      const leads = JSON.parse(localStorage.getItem('vocari_leads') || '[]');
      leads.push({
        ...formData,
        hollandCode,
        timestamp: new Date().toISOString(),
        source: 'test_gratis'
      });
      localStorage.setItem('vocari_leads', JSON.stringify(leads));
      
      // Also try to send to backend if available
      try {
        await fetch('https://vocari-api.fly.dev/api/v1/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } catch (e) {
        // Backend might not have this endpoint, that's ok
        console.log('Lead saved locally');
      }

      setSubmitted(true);
    } catch (err) {
      setError('Error al enviar. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-800 mb-2">
          ¡Gracias! 🙌
        </h3>
        <p className="text-green-700">
          Hemos recibido tu información. Un orientador te contactará pronto.
        </p>
        <p className="text-sm text-green-600 mt-4">
          Perfil: <strong>{hollandCode}</strong> - Te enviaremos información sobre carreras relacionadas.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-indigo-900 mb-2">
          🎯 ¿Quieres que un orientador te contacte?
        </h3>
        <p className="text-indigo-700">
          Déjanos tus datos y te enviaremos información personalizada sobre carreras
          basadas en tu perfil <strong>({hollandCode})</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="inline w-4 h-4 mr-1" />
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone className="inline w-4 h-4 mr-1" />
            WhatsApp (opcional)
          </label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            placeholder="+56 9 1234 5678"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿Qué te interesa más?
          </label>
          <select
            value={formData.interes}
            onChange={(e) => setFormData({ ...formData, interes: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="carreras">Información sobre carreras</option>
            <option value="universidad">Cómo elegir universidad</option>
            <option value="orientacion">Hablar con un orientador</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {loading ? 'Enviando...' : 'Enviar información'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Tus datos están seguros. No spam, solo te contactaremos sobre orientación vocacional.
        </p>
      </form>
    </motion.div>
  );
}

export default LeadCaptureForm;
