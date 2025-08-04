import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, Heart, MessageCircle } from 'lucide-react';

const CTASection = ({ onOpenChat }) => {
  const benefits = [
    {
      icon: Target,
      title: "Descubre tu propósito",
      description: "Identifica tus verdaderos intereses y pasiones"
    },
    {
      icon: Sparkles,
      title: "Encuentra tu camino",
      description: "Obtén recomendaciones personalizadas de carreras"
    },
    {
      icon: Heart,
      title: "Toma decisiones conscientes",
      description: "Evita la frustración de elegir mal tu carrera"
    }
  ];

  return (
    <section id="test" className="section-padding bg-orienta-dark relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-orienta-blue rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orienta-blue rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-orienta-blue rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-white mb-6">
            Toma decisiones conscientes, felices y alineadas contigo mismo
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            No dejes tu futuro al azar. Con Brújula, cada decisión que tomes estará respaldada 
            por inteligencia artificial y psicología vocacional.
          </p>
        </motion.div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="bg-gradient-to-r from-orienta-blue to-orienta-blue/80 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target size={48} className="text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-poppins font-semibold text-white mb-4">
              ¿Listo para descubrir tu vocación?
            </h3>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Nuestro chat de IA te ayudará a encontrar el camino perfecto 
              para tu futuro profesional en solo 5 minutos.
            </p>
            
            <button 
              onClick={onOpenChat}
              className="bg-white text-orienta-dark px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <MessageCircle size={20} />
              Realiza tu Test Vocacional
              <ArrowRight size={20} />
            </button>
            
            <p className="text-white/70 text-sm mt-4">
              ✓ Gratuito • ✓ Sin registro • ✓ Resultados inmediatos • ✓ Chat interactivo
            </p>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-full hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-orienta-blue rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon size={32} className="text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">
                  {benefit.title}
                </h4>
                <p className="text-white/80 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8">
            <h4 className="text-xl font-semibold text-white mb-6">
              Lo que dicen nuestros usuarios
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orienta-blue mb-2">2,500+</div>
                <div className="text-white/80">Jóvenes orientados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orienta-blue mb-2">94%</div>
                <div className="text-white/80">Satisfacción</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orienta-blue mb-2">15</div>
                <div className="text-white/80">Países de LATAM</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="border-2 border-orienta-blue/30 rounded-2xl p-8">
            <h3 className="text-2xl md:text-3xl font-poppins font-semibold text-white mb-4">
              Tu futuro profesional te espera
            </h3>
            <p className="text-lg text-white/80 mb-6 max-w-2xl mx-auto">
              No pierdas más tiempo. Comienza tu viaje hacia una carrera satisfactoria y significativa.
            </p>
            <button 
              onClick={onOpenChat}
              className="btn-primary text-lg px-10 py-4 flex items-center gap-2 mx-auto"
            >
              <MessageCircle size={20} />
              Comenzar Ahora
              <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection; 