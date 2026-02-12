import { motion } from 'framer-motion';
import { TrendingDown, Users, AlertTriangle } from 'lucide-react';

const ProblemSection = () => {
  const stats = [
    {
      icon: TrendingDown,
      number: "29%",
      description: "abandona la carrera en el primer ano",
      color: "text-red-500",
      bg: "bg-red-50"
    },
    {
      icon: Users,
      number: "43%",
      description: "trabaja fuera del area que estudio",
      color: "text-orange-500",
      bg: "bg-orange-50"
    },
    {
      icon: AlertTriangle,
      number: "76%",
      description: "no esta conforme con su empleo actual",
      color: "text-amber-500",
      bg: "bg-amber-50"
    }
  ];

  return (
    <section id="problema" className="section-padding bg-vocari-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-vocari-dark mb-6">
            El Problema de la Orientacion Vocacional
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Los jovenes enfrentan una crisis de orientacion vocacional que afecta su futuro profesional.
            La falta de herramientas adecuadas genera decisiones apresuradas con impacto negativo.
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="card text-center"
            >
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-2xl ${stat.bg} transition-colors duration-300`}>
                  <stat.icon size={32} className={stat.color} />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-poppins font-bold text-vocari-dark mb-2">
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3 className="text-2xl md:text-3xl font-poppins font-semibold text-vocari-dark mb-6">
              Por que ocurre esto?
            </h3>
            <div className="space-y-6">
              {[
                { num: '1', title: 'Falta de autoconocimiento', desc: 'Los jovenes no tienen herramientas para identificar sus fortalezas, intereses y valores personales.' },
                { num: '2', title: 'Informacion desactualizada', desc: 'Los datos sobre carreras y mercado laboral cambian constantemente, pero las orientaciones tradicionales no se actualizan.' },
                { num: '3', title: 'Presion social y familiar', desc: 'Las expectativas de padres, amigos y sociedad influyen en decisiones que no reflejan los verdaderos intereses del joven.' }
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-vocari-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">{item.num}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-vocari-dark mb-1">{item.title}</h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-vocari-primary/5 to-vocari-accent/5 rounded-2xl p-8 border border-vocari-primary/10">
              <div className="text-center">
                <div className="w-20 h-20 bg-vocari-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={40} className="text-vocari-primary" />
                </div>
                <h4 className="text-xl font-semibold text-vocari-dark mb-4">
                  El Costo de una Mala Decision
                </h4>
                <ul className="text-left space-y-3 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-vocari-primary rounded-full flex-shrink-0"></div>
                    Perdida de tiempo y recursos economicos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-vocari-primary rounded-full flex-shrink-0"></div>
                    Frustracion y baja autoestima
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-vocari-primary rounded-full flex-shrink-0"></div>
                    Carreras profesionales insatisfactorias
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-vocari-primary rounded-full flex-shrink-0"></div>
                    Impacto negativo en la economia familiar
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
