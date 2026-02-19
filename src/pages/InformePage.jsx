import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, GraduationCap, CheckCircle, ArrowRight, Shield, BarChart3, FileText, Star, Calculator, School, ChevronRight, AlertCircle } from 'lucide-react';
import { getCurrentUser } from '../lib/supabase';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Dashboard en Tiempo Real',
    description: 'Visualiza el progreso de todos tus estudiantes y genera reportes instantáneos'
  },
  {
    icon: FileText,
    title: 'Informes Individuales',
    description: 'Cada estudiante recibe su informe vocacional personalizado basado en RIASEC'
  },
  {
    icon: GraduationCap,
    title: 'Datos MINEDUC Oficiales',
    description: 'Información actualizada de carreras, universidades y ponderaciones válidas'
  },
  {
    icon: Shield,
    title: 'Apoyo de Orientadores',
    description: 'Equipo de orientadores certificados disponibles para consultas y soporte'
  }
];

const PLAN_FEATURES = {
  basico: [
    '30 estudiantes',
    'Test RIASEC completo',
    'Informe individual por estudiante',
    'Dashboard del colegio',
    'Soporte por email'
  ],
  profesional: [
    '100 estudiantes',
    'Test RIASEC completo',
    'Informe individual premium',
    'Dashboard avanzado',
    'Soporte prioritario',
    'Capacitación para orientadores',
    'Análisis de cohortes'
  ],
  institucional: [
    'Estudiantes ilimitados',
    'Test RIASEC completo',
    'Informe individual premium',
    'Dashboard enterprise',
    'Soporte dedicado 24/7',
    'Capacitación completa',
    'Análisis personalizado',
    'API integration'
  ]
};

const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    price: 150000,
    description: 'Ideal para colegios pequeños',
    features: PLAN_FEATURES.basico,
    popular: false
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 350000,
    description: 'Para colegios medianos',
    features: PLAN_FEATURES.profesional,
    popular: true
  },
  {
    id: 'institucional',
    name: 'Institucional',
    price: null,
    description: 'Para grandes instituciones',
    features: PLAN_FEATURES.institucional,
    popular: false
  }
];

export default function InformePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    colegio: '',
    estudiantes: '',
    mensaje: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuote = (e) => {
    e.preventDefault();
    // Aquí enviarías los datos a tu backend o email
    alert('¡Gracias! Nos contactaremos pronto contigo.');
    setShowContactForm(false);
  };

  const handleSelectPlan = (plan) => {
    if (plan.id === 'institucional') {
      setShowContactForm(true);
      return;
    }
    if (!user) {
      navigate('/auth/callback?redirect=/informe');
      return;
    }
    // Aquí navegarías al checkout de Stripe para el plan
    navigate('/demo-colegio');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="text-white font-bold text-xl hover:text-blue-400 transition-colors"
          >
            Vocari<span className="text-blue-400">.cl</span>
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Inicio
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
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-6">
              🏫 Para Colegios y Establecimientos Educacionales
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Orientación Vocacional{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                para tu Colegio
              </span>
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Implementa el test vocacional RIASEC con datos reales del MINEDUC. 
              Tus estudiantes merecen una orientación profesional basada en evidencia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => document.getElementById('planes').scrollIntoView({ behavior: 'smooth' })}
                className="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                Ver Planes
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/demo-colegio')}
                className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                Ver Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Por qué elegir Vocari?
            </h2>
            <p className="text-white/60">
              La herramienta de orientación vocacional más completa para colegios chilenos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="text-blue-400" size={24} />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Planes para Colegios
            </h2>
            <p className="text-white/60">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 border-2 border-blue-400' 
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-white text-blue-900 text-sm font-bold px-4 py-1.5 rounded-full">
                      <Star size={14} className="fill-current" />
                      Más Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  {plan.description}
                </p>

                {plan.price ? (
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price.toLocaleString('es-CL')}
                    </span>
                    <span className="text-white/60 text-sm">/mes</span>
                  </div>
                ) : (
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">
                      Custom
                    </span>
                  </div>
                )}

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="text-white mt-0.5 flex-shrink-0" size={18} />
                      <span className="text-white/90 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-2 transition-all ${
                    plan.popular
                     -center gap ? 'bg-white text-blue-900 hover:bg-white/90'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {plan.id === 'institucional' ? 'Solicitar Cotización' : 'Comenzar'}
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Trust */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-1">50+</div>
              <div className="text-white/50 text-sm">Colegios aliados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">10000+</div>
              <div className="text-white/50 text-sm">Estudiantes evaluados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">4.8/5</div>
              <div className="text-white/50 text-sm">Satisfacción</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            ¿Listo para transformar la orientación vocacional de tu colegio?
          </h2>
          <p className="text-white/60 mb-8">
            Agenda una demostración sin costo y conoce cómo Vocari puede ayudar a tus estudiantes.
          </p>
          <button
            onClick={() => setShowContactForm(true)}
            className="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            Solicitar Cotización
          </button>
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

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Solicitar Cotización</h3>
              <button 
                onClick={() => setShowContactForm(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  placeholder="juan@colegio.cl"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Colegio</label>
                <input
                  type="text"
                  required
                  value={formData.colegio}
                  onChange={(e) => setFormData({...formData, colegio: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  placeholder="Colegio Nacional"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Número de estudiantes</label>
                <input
                  type="number"
                  value={formData.estudiantes}
                  onChange={(e) => setFormData({...formData, estudiantes: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Mensaje (opcional)</label>
                <textarea
                  value={formData.mensaje}
                  onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="¿Tienes alguna pregunta específica?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Enviar Solicitud
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
