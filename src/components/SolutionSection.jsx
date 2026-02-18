import { motion } from 'framer-motion';
import { Play, Brain, Heart, Target, Zap } from 'lucide-react';

const SolutionSection = () => {
  const features = [
    {
      icon: Brain,
      title: "IA Avanzada",
      description: "Algoritmos de machine learning que analizan patrones y preferencias para ofrecer recomendaciones personalizadas."
    },
    {
      icon: Heart,
      title: "Enfoque Humano",
      description: "Combinamos tecnología con psicología vocacional para resultados más precisos y empáticos."
    },
    {
      icon: Target,
      title: "Orientación Personalizada",
      description: "Cada joven recibe un plan único basado en sus intereses, habilidades y valores personales."
    },
    {
      icon: Zap,
      title: "Resultados Rápidos",
      description: "En menos de 30 minutos obtienes un análisis completo de tu perfil vocacional."
    }
  ];

  const handleDemoClick = () => {
    // Simular apertura de demo
    alert('¡Demo próximamente disponible! Mientras tanto, puedes explorar nuestra plataforma.');
  };

  return (
    <section id="solucion" className="section-padding bg-orienta-dark">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-white mb-6">
            Nuestra Solución
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Vocari utiliza inteligencia artificial para guiar vocacionalmente a jóvenes de 16 a 24 años,
            combinando tecnología avanzada con un enfoque humano que respeta la individualidad de cada persona.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-orienta-blue/20 to-orienta-blue/10 rounded-2xl p-8 md:p-12 mb-16"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-orienta-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <Target size={40} className="text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-poppins font-semibold text-white mb-6">
              Nuestra Misión
            </h3>
            <p className="text-lg md:text-xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              "Transformar la orientación vocacional en Latinoamérica mediante tecnología de inteligencia artificial 
              que empodere a los jóvenes para tomar decisiones conscientes, felices y alineadas con su verdadero propósito. 
              Creemos que cada persona merece encontrar su camino único hacia una carrera satisfactoria y significativa."
            </p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-full hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-orienta-blue rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon size={32} className="text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h4>
                <p className="text-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-poppins font-semibold text-orienta-dark mb-6">
              ¿Cómo funciona Vocari?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Nuestra plataforma combina evaluaciones psicológicas tradicionales con análisis de IA 
              para crear un perfil vocacional completo y personalizado.
            </p>
            
            {/* Demo Video Placeholder */}
            <div className="relative bg-gradient-to-br from-orienta-blue/20 to-orienta-dark/20 rounded-2xl p-8 mb-8">
              <div className="aspect-video bg-orienta-dark/50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-orienta-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play size={32} className="text-white ml-1" />
                  </div>
                  <p className="text-white/80 text-lg">Demo Interactivo</p>
                  <p className="text-white/60 text-sm">Próximamente disponible</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleDemoClick}
              className="btn-primary text-lg px-10 py-4 flex items-center gap-2 mx-auto"
            >
              <Play size={20} />
              Ver Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection; 