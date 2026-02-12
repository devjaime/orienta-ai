import { motion } from 'framer-motion';
import { Upload, LayoutDashboard, Key, Users, BarChart3, Shield } from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Importacion masiva',
    description: 'Carga estudiantes via CSV con nombre, email, curso y codigo. Genera codigos de activacion automaticamente.'
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard de administracion',
    description: 'Panel completo para admin_colegio con estadisticas de activacion, tests completados y progreso por curso.'
  },
  {
    icon: Key,
    title: 'Codigos de activacion',
    description: 'Cada estudiante recibe un codigo unico. Genera reportes imprimibles con instrucciones de activacion.'
  },
  {
    icon: Users,
    title: 'Gestion de orientadores',
    description: 'Asigna orientadores a estudiantes automaticamente. Gestion de disponibilidad y notas de sesion.'
  },
  {
    icon: BarChart3,
    title: 'Reportes institucionales',
    description: 'Estadisticas agregadas por curso, tendencias RIASEC y tasas de completitud del test vocacional.'
  },
  {
    icon: Shield,
    title: 'Multi-tenant seguro',
    description: 'Cada colegio opera en su propio espacio. Los datos estan aislados y protegidos por institucion.'
  }
];

const B2BFeatures = () => {
  return (
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
            Todo lo que tu colegio necesita
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Herramientas disenadas para orientadores y administradores de instituciones educativas
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-vocari-b2b/10 rounded-xl flex items-center justify-center mb-5">
                <feature.icon size={24} className="text-vocari-b2b" />
              </div>
              <h3 className="text-lg font-poppins font-semibold text-vocari-dark mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default B2BFeatures;
