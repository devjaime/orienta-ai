import { useState } from 'react';
import { User, Mail, ArrowRight, Loader2 } from 'lucide-react';

const TEST_URL = 'https://app.vocari.cl/test-gratis';
const LEADS_API_URL = 'https://vocari-api.fly.dev/api/v1/leads';

function TestLeadCapturePage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      return 'El nombre es obligatorio.';
    }

    if (!formData.email.trim()) {
      return 'El email es obligatorio.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Ingresa un email válido.';
    }

    return '';
  };

  const redirectToTest = () => {
    const params = new URLSearchParams({
      nombre: formData.nombre.trim(),
      email: formData.email.trim()
    });

    window.location.assign(`${TEST_URL}?${params.toString()}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    const leadPayload = {
      nombre: formData.nombre.trim(),
      email: formData.email.trim(),
      source: 'landing_test_redirect',
      interes: 'test_gratis'
    };

    try {
      const storedLeads = JSON.parse(localStorage.getItem('vocari_test_leads') || '[]');
      storedLeads.push({
        ...leadPayload,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('vocari_test_leads', JSON.stringify(storedLeads));
    } catch (storageError) {
      console.error('No se pudo guardar el lead en localStorage:', storageError);
    }

    try {
      await fetch(LEADS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload)
      });
    } catch (apiError) {
      console.error('No se pudo enviar el lead al backend:', apiError);
    }

    redirectToTest();
  };

  return (
    <div className="min-h-screen bg-vocari-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-vocari-dark mb-2">
            Antes de comenzar tu test gratis
          </h1>
          <p className="text-gray-600">
            Déjanos tu nombre y correo para enviarte seguimiento de orientación vocacional.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-vocari-dark mb-1">
              Nombre completo
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vocari-primary focus:border-vocari-primary outline-none"
                placeholder="Ej: Camila Rojas"
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-vocari-dark mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vocari-primary focus:border-vocari-primary outline-none"
                placeholder="Ej: camila@email.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vocari-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-vocari-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Redirigiendo...
              </>
            ) : (
              <>
                Ir al test gratis
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TestLeadCapturePage;
