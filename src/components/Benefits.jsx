import { CheckCircle, Star } from 'lucide-react';

const stats = [
  { value: '1000+', label: 'Estudiantes atendidos' },
  { value: '50+', label: 'Orientadores certificados' },
  { value: '4.8/5', label: 'Valoración promedio' },
  { value: '98%', label: 'Satisfacción garantizada' },
];

const benefits = [
  {
    icon: '📊',
    title: 'Datos reales de empleabilidad',
    description: 'Usamos datos oficiales del MINEDUC sobre vacantes, remuneraciones y demanda laboral real en Chile.'
  },
  {
    icon: '🔬',
    title: 'Método científico validado',
    description: 'Basado en el modelo RIASEC de John Holland, usado por universidades de todo el mundo.'
  },
  {
    icon: '👨‍⚕️',
    title: 'Revisión profesional',
    description: 'Cada informe es revisado y validado por orientadores vocacionales certificados.'
  },
  {
    icon: '⚡',
    title: 'Resultados en 24-48 horas',
    description: 'Rápido y eficiente. Recibe tu informe profesional en menos de 2 días hábiles.'
  },
  {
    icon: '💰',
    title: 'Garantía de satisfacción',
    description: 'Si no estás satisfecho, te devolvemos tu dinero. Sin preguntas, sin complicaciones.'
  },
  {
    icon: '🔒',
    title: 'Pago seguro con PayPal',
    description: 'Tu pago está protegido. PayPal te permite comprar con tranquilidad.'
  }
];

export default function Benefits() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-vocari-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6">
              <div className="text-4xl font-black text-vocari-primary mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
            ¿Por qué elegir Vocari?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            La diferencia está en los datos. No adivinamos, usamos evidencia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="font-bold text-vocari-dark mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-center">
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="text-green-500 w-5 h-5" />
            <span className="text-sm">Datos MINEDUC 2025</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="text-green-500 w-5 h-5" />
            <span className="text-sm">Método RIASEC validado</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="text-green-500 w-5 h-5" />
            <span className="text-sm">Orientadores certificados</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="text-green-500 w-5 h-5" />
            <span className="text-sm">Garantía de satisfacción</span>
          </div>
        </div>
      </div>
    </section>
  );
}
