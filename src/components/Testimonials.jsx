import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "María González",
    role: "Madre de estudiante",
    text: "Mi hijo no sabía qué carrera estudiar. El informe de Vocari le dio claridad total. ¡Recomendado!",
    rating: 5,
    avatar: "👩‍👦"
  },
  {
    name: "Carlos Mendoza",
    role: "Estudiante universitario",
    text: "Pensaba estudiar ingeniería por mis papás. El test RIASEC me ayudó a descubrir que mi pasión es el diseño.",
    rating: 5,
    avatar: "🎨"
  },
  {
    name: "Patricia Rojas",
    role: "Apoderada",
    text: "Wena inversión. El informe viene con datos reales de empleabilidad. Mi hija eligió Pedagogía.",
    rating: 5,
    avatar: "📚"
  },
  {
    name: "Javier Torres",
    role: "Estudiante 4° Medio",
    text: "Me encantó la parte de las carreras con datos del MINEDUC. Súper profesional.",
    rating: 5,
    avatar: "🚀"
  },
  {
    name: "Andrea Valenzuela",
    role: "Estudiante universitaria",
    text: "El informe me ayudó a confirmar que administración era lo mío. Datos muy precisos.",
    rating: 5,
    avatar: "💼"
  },
  {
    name: "Roberto Díaz",
    role: "Padre",
    text: "Mi hija estaba perdida. El informe le dio dirección. Vale cada peso.",
    rating: 5,
    avatar: "👨"
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-gray-600">
            Más de 1000 estudiantes han encontrado su camino con Vocari
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-gray-600 ml-2">4.8/5 promedio</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-vocari-bg rounded-2xl p-6 border border-gray-100 relative"
            >
              <Quote className="absolute top-4 right-4 text-gray-200 w-8 h-8" />
              
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-bold text-vocari-dark">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
              
              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-gray-600 italic">"{testimonial.text}"</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            ¿Listo para encontrar tu carrera ideal?
          </p>
          <button
            onClick={() => window.location.href = '/test'}
            className="px-8 py-3 bg-vocari-primary text-white font-bold rounded-xl hover:bg-vocari-light transition-colors"
          >
            Hacer el Test Gratis →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
