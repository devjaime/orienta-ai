import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, BarChart3, GraduationCap, UserCheck, Presentation, Sparkles, Check, Star, ArrowRight, Shield, Clock, Target, Brain, Users, AlertCircle } from 'lucide-react';
import { getCurrentUser, getLatestTestResult } from '../lib/supabase';
import { getReportPlans, formatPriceCLP } from '../lib/reportService';
import SimpleCheckout from '../components/SimpleCheckout';

const BENEFITS = [
  {
    icon: Target,
    title: 'Método RIASEC',
    description: 'Científicamente validado internacionalmente para orientación vocacional'
  },
  {
    icon: Brain,
    title: 'Datos MINEDUC',
    description: 'Información real de carreras, universidades y ponderaciones en Chile'
  },
  {
    icon: Users,
    title: 'Revisado por Orientadores',
    description: 'Profesionales certificados supervisan cada informe antes de entregártelo'
  },
  {
    icon: Shield,
    title: '100% Seguro',
    description: 'Tus datos están protegidos con estándares de seguridad altos'
  }
];

const PLAN_FEATURES = {
  esencial: [
    { icon: FileText, text: 'Informe PDF completo (20+ páginas)' },
    { icon: BarChart3, text: 'Análisis detallado de tu perfil RIASEC' },
    { icon: GraduationCap, text: '10 carreras recomendadas' },
    { icon: UserCheck, text: 'Revisión por orientador certificado' }
  ],
  premium: [
    { icon: FileText, text: 'Informe PDF completo (30+ páginas)' },
    { icon: BarChart3, text: 'Análisis profundo de tu perfil RIASEC' },
    { icon: GraduationCap, text: '20 carreras con datos completos' },
    { icon: UserCheck, text: 'Revisión prioritaria por orientador' },
    { icon: Presentation, text: 'Explicación visual personalizada' },
    { icon: Sparkles, text: 'Resumen ejecutivo animado' }
  ]
};

export default function InformePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

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
      console.error('Error loading informe page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    if (!user) {
      navigate('/auth/callback?redirect=/informe');
      return;
    }
    if (!testResult) {
      navigate('/test');
      return;
    }
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vocari-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vocari-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vocari-primary">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="text-white font-bold text-xl hover:text-vocari-accent transition-colors"
          >
            Vocari<span className="text-vocari-accent">.cl</span>
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Inicio
            </button>
            <button 
              onClick={() => navigate('/colegios')}
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Para Colegios
            </button>
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                Mi Dashboard
              </button>
            ) : (
              <button 
                onClick={() => navigate('/auth/callback?redirect=/informe')}
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-vocari-accent/20 text-vocari-accent text-sm font-medium mb-6">
              📊 Tu futuro académico en un documento
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Obtén tu{' '}
              <span className="text-vocari-accent">
                Informe Vocacional
              </span>{' '}
              Profesional
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Un análisis completo basado en el método científico RIASEC, 
              datos reales del MINEDUC y revisado por orientadores certificados.
            </p>

            {/* Test Status */}
            {user && testResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 bg-green-500/20 border border-green-500/30 rounded-full px-6 py-2 mb-8"
              >
                <Check className="text-green-400" size={20} />
                <span className="text-white">
                  Perfil <span className="font-bold text-green-400">{testResult.codigo_holland}</span> detectado
                </span>
              </motion.div>
            )}

            {user && !testResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-6 py-2 mb-8"
              >
                <AlertCircle className="text-yellow-400" size={20} />
                <span className="text-white">
                  ¡Completa el test primero!
                </span>
                <button 
                  onClick={() => navigate('/test')}
                  className="ml-2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Hacer Test
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-vocari-light/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-vocari-light/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-vocari-light/20 transition-colors"
              >
                <div className="w-12 h-12 bg-vocari-accent/20 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="text-vocari-accent" size={24} />
                </div>
                <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                <p className="text-white/50 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Elige tu Plan
            </h2>
            <p className="text-white/60">
              Ambos planes incluyen revisión por orientador certificado
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, index) => {
              const isPremium = plan.name === 'premium';
              const features = PLAN_FEATURES[plan.name] || [];

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className={`relative rounded-2xl p-8 ${
                    isPremium 
                      ? 'bg-vocari-accent border-2 border-vocari-accent' 
                      : 'bg-vocari-light/10 border border-white/20'
                  }`}
                >
                  {isPremium && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="flex items-center gap-1 bg-vocari-primary text-white text-sm font-bold px-4 py-1.5 rounded-full">
                        <Star size={14} className="fill-current" />
                        Más Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.display_name}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-white">
                      {formatPriceCLP(plan.price_clp)}
                    </span>
                    <span className="text-white/60 text-sm">CLP</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="text-white mt-0.5 flex-shrink-0" size={18} />
                        <span className="text-white/90 text-sm">{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      isPremium
                        ? 'bg-vocari-primary text-white hover:bg-vocari-light'
                        : 'bg-vocari-accent text-vocari-dark-text hover:bg-vocari-accent/90'
                    }`}
                  >
                    {isPremium ? 'Obtener Premium' : 'Obtener Esencial'}
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ / Trust */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-1">5000+</div>
              <div className="text-white/50 text-sm">Informes entregados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">4.9/5</div>
              <div className="text-white/50 text-sm">Satisfacción</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">48h</div>
              <div className="text-white/50 text-sm">Tiempo de entrega</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/40 text-sm">
            © 2024 Vocari.cl - Orientación vocacional con IA
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/terminos" className="text-white/40 hover:text-white transition-colors">Términos</a>
            <a href="/privacidad" className="text-white/40 hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <SimpleCheckout
          plan={selectedPlan}
          user={user}
          testResult={testResult}
          onClose={handleCloseCheckout}
        />
      )}
    </div>
  );
}
