import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, BarChart3, GraduationCap, UserCheck, Presentation, Sparkles, Check, Star, ArrowLeft, AlertCircle } from 'lucide-react';
import { getCurrentUser, getLatestTestResult } from '../lib/supabase';
import { getReportPlans, createCheckoutSession, formatPriceCLP } from '../lib/reportService';

const PLAN_ICONS = {
  esencial: [
    { icon: FileText, text: 'Informe PDF completo' },
    { icon: BarChart3, text: 'Análisis RIASEC detallado' },
    { icon: GraduationCap, text: 'Carreras recomendadas con datos reales MINEDUC' },
    { icon: UserCheck, text: 'Revisado por orientadores calificados' }
  ],
  premium: [
    { icon: FileText, text: 'Informe PDF completo' },
    { icon: BarChart3, text: 'Análisis RIASEC detallado' },
    { icon: GraduationCap, text: 'Carreras recomendadas con datos reales MINEDUC' },
    { icon: UserCheck, text: 'Revisado por orientadores calificados' },
    { icon: Presentation, text: 'Explicación visual personalizada' },
    { icon: Sparkles, text: 'Resumen ejecutivo animado' }
  ]
};

function InformesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentUser, latestTest, reportPlans] = await Promise.all([
        getCurrentUser(),
        getLatestTestResult(),
        getReportPlans()
      ]);

      setUser(currentUser);
      setTestResult(latestTest);
      setPlans(reportPlans);
    } catch (error) {
      console.error('Error loading informes page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId) => {
    if (!user) {
      const { signInWithGoogle } = await import('../lib/supabase');
      await signInWithGoogle();
      return;
    }

    if (!testResult) {
      navigate('/test');
      return;
    }

    setPurchasing(planId);
    try {
      const checkoutUrl = await createCheckoutSession(planId);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error al iniciar el pago. Intenta nuevamente.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vocari-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vocari-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vocari-bg">
      {/* Header */}
      <div className="bg-vocari-primary">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            Volver al inicio
          </button>
          <h1 className="text-3xl md:text-4xl font-poppins font-bold text-white mb-2">
            Informes Vocacionales Profesionales
          </h1>
          <p className="text-white/70 max-w-2xl">
            Obtén un informe completo basado en datos oficiales del MINEDUC,
            método científico RIASEC y revisado por orientadores calificados.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Estado del test */}
        {user && !testResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8 flex items-start gap-4"
          >
            <AlertCircle size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-gray-900 font-semibold mb-1">
                Primero completa el Test RIASEC
              </h3>
              <p className="text-gray-500 mb-3">
                Para generar tu informe personalizado necesitas haber completado el test vocacional gratuito.
              </p>
              <button
                onClick={() => navigate('/test')}
                className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
              >
                Hacer Test RIASEC
              </button>
            </div>
          </motion.div>
        )}

        {user && testResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-8 flex items-start gap-4"
          >
            <Check size={24} className="text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-gray-900 font-semibold mb-1">
                Test RIASEC completado
              </h3>
              <p className="text-gray-500">
                Tu código Holland es <span className="text-vocari-primary font-mono font-bold">{testResult.codigo_holland}</span>.
                Selecciona un plan para obtener tu informe profesional.
              </p>
            </div>
          </motion.div>
        )}

        {/* Planes */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const isPremium = plan.name === 'premium';
            const features = PLAN_ICONS[plan.name] || [];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`relative rounded-2xl p-8 bg-white shadow-sm ${
                  isPremium
                    ? 'border-2 border-vocari-primary'
                    : 'border border-gray-200'
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-vocari-primary text-white text-sm font-semibold px-4 py-1 rounded-full">
                      <Star size={14} className="fill-current" />
                      Recomendado
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-poppins font-bold text-vocari-dark mb-2">
                  {plan.display_name}
                </h3>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold text-vocari-primary">
                    {formatPriceCLP(plan.price_clp)}
                  </span>
                  <span className="text-gray-500 text-sm">CLP</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-vocari-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={14} className="text-vocari-primary" />
                      </div>
                      <span className="text-gray-600">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={purchasing === plan.id}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPremium
                      ? 'bg-vocari-primary text-white hover:bg-blue-400'
                      : 'bg-white/10 border border-vocari-primary text-vocari-primary hover:bg-vocari-primary hover:text-white'
                  }`}
                >
                  {purchasing === plan.id
                    ? 'Procesando...'
                    : !user
                    ? 'Iniciar sesión para comprar'
                    : !testResult
                    ? 'Completa el test primero'
                    : isPremium
                    ? 'Obtener Informe Premium'
                    : 'Obtener Informe'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Diferenciadores */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-poppins font-semibold text-white text-center mb-8">
            ¿Por qué elegir nuestros informes?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <GraduationCap size={32} className="text-vocari-primary mx-auto mb-3" />
              <h4 className="text-gray-900 font-semibold mb-2">Datos Reales MINEDUC</h4>
              <p className="text-gray-500 text-sm">
                Usamos datos oficiales del Ministerio de Educación para nuestras recomendaciones de carreras.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <BarChart3 size={32} className="text-vocari-primary mx-auto mb-3" />
              <h4 className="text-gray-900 font-semibold mb-2">Método Científico RIASEC</h4>
              <p className="text-gray-500 text-sm">
                Basado en el modelo Holland validado internacionalmente, no en tests genéricos.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <UserCheck size={32} className="text-vocari-primary mx-auto mb-3" />
              <h4 className="text-gray-900 font-semibold mb-2">Revisión Profesional</h4>
              <p className="text-gray-500 text-sm">
                Cada informe es revisado y aprobado por orientadores vocacionales calificados.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Link a mis informes */}
        {user && (
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/mis-informes')}
              className="text-vocari-primary hover:text-blue-300 transition-colors underline"
            >
              Ver mis informes anteriores
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InformesPage;
