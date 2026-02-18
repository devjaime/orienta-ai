import { motion } from 'framer-motion'
import { Download, Eye, FileText, BarChart3, GraduationCap, TrendingUp, Award, CheckCircle, MapPin, DollarSign, Users } from 'lucide-react'

// Ejemplo de datos de un perfil RIASEC
const perfilEjemplo = {
  codigo: 'SIA', // Social, Investigativo, Artístico
  dimensiones: {
    S: 85, // Social
    I: 72, // Investigativo
    A: 68, // Artístico
    E: 45, // Empresarial
    C: 32, // Convencional
    R: 28  // Realista
  },
  nombre: 'Perfil Social-Investigativo-Artístico',
  descripcion: 'Te interesan las actividades que te, investigar permitan ayudar a otros temas profundos y expresar tu creatividad. Valoras la autonomía en el trabajo y te desempeñas bien en entornos colaborativos.'
}

// Ejemplo de carreras recomendadas
const carrerasEjemplo = [
  {
    nombre: 'Psicología',
    area: 'Ciencias Sociales',
    match: 95,
    salary: { min: 800000, max: 1800000 },
    demand: 'Alta',
    descripcion: 'Carrera orientada a comprender el comportamiento humano, con oportunidades en clínica, educacional y organizacional.'
  },
  {
    nombre: 'Diseño Gráfico',
    area: 'Arte y Diseño',
    match: 92,
    salary: { min: 600000, max: 1500000 },
    demand: 'Media-Alta',
    descripcion: 'Creación visual para comunicación, branding y medios digitales. Combina creatividad con tecnología.'
  },
  {
    nombre: 'Pedagogía en Inglés',
    area: 'Educación',
    match: 89,
    salary: { min: 700000, max: 1200000 },
    demand: 'Alta',
    descripcion: 'Enseñanza del idioma inglés en niveles escolar y superior. Alta demanda en Chile.'
  },
  {
    nombre: 'Periodismo',
    area: 'Comunicación',
    match: 87,
    salary: { min: 650000, max: 1400000 },
    demand: 'Media',
    descripcion: 'Investigación y comunicación de noticias. Digital y tradicional.'
  },
  {
    nombre: 'Trabajo Social',
    area: 'Ciencias Sociales',
    match: 85,
    salary: { min: 550000, max: 1000000 },
    demand: 'Alta',
    descripcion: 'Intervención en problemáticas sociales, gestión de programas comunitarios.'
  }
]

// Proyección laboral por carrera
const proyecciones = [
  { year: 2024, psychology: 850, diseno: 700, pedagogia: 750 },
  { year: 2025, psychology: 880, diseno: 740, pedagogia: 780 },
  { year: 2026, psychology: 920, diseno: 790, pedagogia: 820 },
  { year: 2027, psychology: 960, diseno: 850, pedagogia: 860 },
  { year: 2028, psychology: 1000, diseno: 900, pedagogia: 900 }
]

export default function DemoInforme() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-vocari-dark text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Ejemplo de Informe Vocacional
            </h1>
            <p className="text-xl text-white/80">
              Así se ve tu informe personalizado de 15+ páginas
            </p>
          </motion.div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-vocari-primary py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-3 text-white">
          <Eye size={20} />
          <span>Este es un ejemplo para que veas exactamente qué recibirás</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        
        {/* Section 1: Tu Perfil */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-vocari-primary/10 rounded-xl flex items-center justify-center">
              <Award className="text-vocari-primary" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-vocari-dark">Tu Perfil RIASEC</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Gráfico de barras */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Puntajes por Dimensión</h3>
              <div className="space-y-3">
                {Object.entries(perfilEjemplo.dimensiones).map(([dim, score]) => (
                  <div key={dim}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{dim === 'R' ? 'Realista' : dim === 'I' ? 'Investigativo' : dim === 'A' ? 'Artístico' : dim === 'S' ? 'Social' : dim === 'E' ? 'Empresarial' : 'Convencional'}</span>
                      <span className="text-gray-500">{score}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descripción del perfil */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Código: {perfilEjemplo.codigo}</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                {perfilEjemplo.descripcion}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  <CheckCircle size={16} className="inline mr-2" />
                  Este perfil tiene alta compatibilidad con carreras de servicio social, educación y creatividad.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Carreras Recomendadas */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-vocari-accent/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-vocari-accent" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-vocari-dark">Carreras Recomendadas</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Basado en tu perfil, estas son las carreras con mayor compatibilidad:
          </p>

          <div className="space-y-4">
            {carrerasEjemplo.map((carrera, i) => (
              <div 
                key={i}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-vocari-dark">{carrera.nombre}</h3>
                    <span className="text-sm text-gray-500">{carrera.area}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-vocari-primary">{carrera.match}%</div>
                    <span className="text-xs text-gray-500">match</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{carrera.descripcion}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <DollarSign size={16} />
                    <span>${carrera.salary.min.toLocaleString()} - ${carrera.salary.max.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <TrendingUp size={16} />
                    <span>Demanda: {carrera.demand}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 3: Proyección Laboral */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-vocari-dark">Proyección Salarial</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Estimación de remuneración promedio primer empleo (en miles CLP):
          </p>

          {/* Gráfico simplificado */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Año</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Psicología</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Diseño</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Pedagogía</th>
                </tr>
              </thead>
              <tbody>
                {proyecciones.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{row.year}</td>
                    <td className="text-right py-3 px-4 text-green-600">${row.psychology}k</td>
                    <td className="text-right py-3 px-4 text-blue-600">${row.diseno}k</td>
                    <td className="text-right py-3 px-4 text-purple-600">${row.pedagogia}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            * Proyecciones basadas en datos MINEDUC 2024 y tendencias del mercado laboral.
          </p>
        </motion.section>

        {/* Section 4: Información de Carrera Destacada */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-vocari-primary to-vocari-dark rounded-2xl shadow-lg p-8 text-white"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <h2 className="text-2xl font-bold">Carrera Destacada: Psicología</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-3">¿Por qué esta carrera?</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-1 flex-shrink-0" />
                  <span>Alta compatibilidad con tu perfil SIA</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-1 flex-shrink-0" />
                  <span>Demanda sostenida en el mercado chileno</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-1 flex-shrink-0" />
                  <span>Multiple áreas de especialización</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-1 flex-shrink-0" />
                  <span>Posibilidad de ejercer de forma independiente</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Datos Clave</h3>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">5 años</div>
                  <div className="text-sm text-white/70">Duración promedio</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">$1.200.000</div>
                  <div className="text-sm text-white/70">Remuneración promedio</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">Alta</div>
                  <div className="text-sm text-white/70">Demanda laboral</div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-8"
        >
          <h3 className="text-2xl font-bold text-vocari-dark mb-4">
            ¿Listo para descubrir tu camino?
          </h3>
          <p className="text-gray-600 mb-6">
            Obtén tu informe personalizado con este nivel de detalle y más
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/test"
              className="inline-flex items-center justify-center gap-2 bg-vocari-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-vocari-light transition-colors"
            >
              <FileText size={20} />
              Hacer Test Gratis
            </a>
            <a
              href="#informes"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-vocari-primary text-vocari-primary px-8 py-4 rounded-xl font-semibold hover:bg-vocari-primary hover:text-white transition-colors"
            >
              <Download size={20} />
              Ver Planes y Precios
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
