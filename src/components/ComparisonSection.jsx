import { motion } from 'framer-motion';
import { Check, X, Star } from 'lucide-react';

const ComparisonSection = () => {
  const platforms = [
    {
      name: "Vocari",
      logo: "🧭",
      isHighlighted: true,
      features: {
        ia: true,
        personalizacion: true,
        latam: true,
        rapido: true,
        humano: true,
        gratuito: false
      }
    },
    {
      name: "MyPlan",
      logo: "📋",
      isHighlighted: false,
      features: {
        ia: false,
        personalizacion: false,
        latam: false,
        rapido: true,
        humano: false,
        gratuito: true
      }
    },
    {
      name: "CareerExplorer",
      logo: "🔍",
      isHighlighted: false,
      features: {
        ia: true,
        personalizacion: false,
        latam: false,
        rapido: false,
        humano: false,
        gratuito: false
      }
    },
    {
      name: "Pymetrics",
      logo: "🎯",
      isHighlighted: false,
      features: {
        ia: true,
        personalizacion: true,
        latam: false,
        rapido: false,
        humano: false,
        gratuito: false
      }
    }
  ];

  const featureLabels = {
    ia: "Inteligencia Artificial",
    personalizacion: "Personalización Avanzada",
    latam: "Enfoque LATAM",
    rapido: "Resultados Rápidos",
    humano: "Enfoque Humano",
    gratuito: "Plan Gratuito"
  };

  return (
    <section id="comparativa" className="section-padding bg-orienta-light">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-orienta-dark mb-6">
            ¿Por qué elegir Vocari?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Compara Vocari con otras plataformas de orientación vocacional y descubre
            por qué somos la mejor opción para jóvenes latinoamericanos.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="min-w-full">
              {/* Header */}
              <div className="bg-orienta-dark text-white">
                <div className="grid grid-cols-5 gap-4 p-6">
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Características</h3>
                  </div>
                  {platforms.map((platform, index) => (
                    <div key={index} className={`text-center ${platform.isHighlighted ? 'bg-orienta-blue/20 rounded-lg p-2' : ''}`}>
                      <div className="text-2xl mb-2">{platform.logo}</div>
                      <div className="font-semibold">{platform.name}</div>
                      {platform.isHighlighted && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Star size={12} className="text-yellow-400 fill-current" />
                          <span className="text-xs text-orienta-blue">Recomendado</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="divide-y divide-gray-200">
                {Object.entries(featureLabels).map(([key, label], index) => (
                  <div key={key} className="grid grid-cols-5 gap-4 p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="text-left flex items-center">
                      <span className="font-medium text-gray-700">{label}</span>
                    </div>
                    {platforms.map((platform, platformIndex) => (
                      <div key={platformIndex} className="text-center flex items-center justify-center">
                        {platform.features[key] ? (
                          <Check size={20} className="text-green-500" />
                        ) : (
                          <X size={20} className="text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Advantages */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h3 className="text-2xl md:text-3xl font-poppins font-semibold text-orienta-dark text-center mb-12">
            Ventajas Clave de Vocari
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orienta-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">🌎</span>
              </div>
              <h4 className="text-xl font-semibold text-orienta-dark mb-3">
                Enfoque Latinoamericano
              </h4>
              <p className="text-gray-600">
                Diseñado específicamente para el contexto educativo y laboral de Latinoamérica, 
                con datos actualizados del mercado regional.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orienta-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">🤖</span>
              </div>
              <h4 className="text-xl font-semibold text-orienta-dark mb-3">
                IA + Psicología
              </h4>
              <p className="text-gray-600">
                Combinamos algoritmos avanzados con principios de psicología vocacional 
                para resultados más precisos y humanos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orienta-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <h4 className="text-xl font-semibold text-orienta-dark mb-3">
                Resultados Inmediatos
              </h4>
              <p className="text-gray-600">
                Obtén un análisis completo de tu perfil vocacional en menos de 30 minutos, 
                sin esperas ni procesos complejos.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-orienta-blue to-orienta-dark rounded-2xl p-8 text-white">
            <h3 className="text-2xl md:text-3xl font-poppins font-semibold mb-4">
              ¿Listo para descubrir tu camino?
            </h3>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Únete a miles de jóvenes que ya han encontrado su vocación con Vocari
            </p>
            <button className="bg-white text-orienta-dark px-8 py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              Comenzar Ahora
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection; 