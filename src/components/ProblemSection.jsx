import { motion } from 'framer-motion';
import { TrendingDown, Users, AlertTriangle } from 'lucide-react';

const ProblemSection = () => {
  const stats = [
    {
      icon: TrendingDown,
      number: "29%",
      description: "abandona la carrera en el primer año",
      color: "text-red-500"
    },
    {
      icon: Users,
      number: "43%",
      description: "trabaja fuera del área que estudió",
      color: "text-orange-500"
    },
    {
      icon: AlertTriangle,
      number: "76%",
      description: "no está conforme con su empleo actual",
      color: "text-yellow-500"
    }
  ];

  return (
    <section id="problema" className="section-padding bg-orienta-light">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-orienta-dark mb-6">
            El Problema de la Orientación Vocacional
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Los jóvenes enfrentan una crisis de orientación vocacional que afecta su futuro profesional. 
            La falta de herramientas adecuadas y la presión social generan decisiones apresuradas que 
            impactan negativamente en su desarrollo personal y laboral.
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="card text-center group hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full bg-gray-100 group-hover:bg-orienta-blue/10 transition-colors duration-300`}>
                  <stat.icon size={32} className={`${stat.color} group-hover:text-orienta-blue transition-colors duration-300`} />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-poppins font-bold text-orienta-dark mb-2">
                {stat.number}
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Problem Details */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3 className="text-2xl md:text-3xl font-poppins font-semibold text-orienta-dark mb-6">
              ¿Por qué ocurre esto?
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orienta-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-orienta-dark mb-2">Falta de autoconocimiento</h4>
                  <p className="text-gray-600">Los jóvenes no tienen herramientas para identificar sus fortalezas, intereses y valores personales.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orienta-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-orienta-dark mb-2">Información desactualizada</h4>
                  <p className="text-gray-600">Los datos sobre carreras y mercado laboral cambian constantemente, pero las orientaciones tradicionales no se actualizan.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orienta-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-orienta-dark mb-2">Presión social y familiar</h4>
                  <p className="text-gray-600">Las expectativas de padres, amigos y sociedad influyen en decisiones que no reflejan los verdaderos intereses del joven.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-orienta-blue/20 to-orienta-dark/20 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-orienta-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={48} className="text-white" />
                </div>
                <h4 className="text-xl font-semibold text-orienta-dark mb-4">
                  El Costo de una Mala Decisión
                </h4>
                <p className="text-gray-600 mb-6">
                  Una elección vocacional incorrecta puede resultar en:
                </p>
                <ul className="text-left space-y-3 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orienta-blue rounded-full"></div>
                    Pérdida de tiempo y recursos económicos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orienta-blue rounded-full"></div>
                    Frustración y baja autoestima
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orienta-blue rounded-full"></div>
                    Carreras profesionales insatisfactorias
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orienta-blue rounded-full"></div>
                    Impacto negativo en la economía familiar
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection; 