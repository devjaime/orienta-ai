import { Star, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const testimonials = [
  {
    name: "María González",
    role: "Madre de estudiante",
    text: "Mi hijo no sabía qué carrera estudiar. El informe de Vocari le dio claridad total. ¡Recomendado!",
    rating: 5,
    emoji: "👩‍👦"
  },
  {
    name: "Carlos Mendoza",
    role: "Estudiante universitario",
    text: "Pensaba estudiar ingeniería por mis papás. El test RIASEC me ayudó a descubrir que mi pasión es el diseño.",
    rating: 5,
    emoji: "🎨"
  },
  {
    name: "Patricia Rojas",
    role: "Apoderada",
    text: "Wena inversión. El informe viene con datos reales de empleabilidad. Mi hija eligió Pedagogía.",
    rating: 5,
    emoji: "📚"
  },
  {
    name: "Javier Torres",
    role: "Estudiante 4° Medio",
    text: "Me encantó la parte de las carreras con datos del MINEDUC. Súper profesional.",
    rating: 5,
    emoji: "🚀"
  }
];

export default function SocialProof() {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Mostrar después de 10 segundos
    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!show) return;
    
    // Rotar cada 5 segundos
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const testimonial = testimonials[current];

  return (
    <div className="fixed bottom-24 right-6 z-40 max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 animate-in slide-in-from-right-2">
        <button
          onClick={() => setShow(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div className="text-3xl">{testimonial.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 text-sm mb-2">"{testimonial.text}"</p>
            <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
            <p className="text-xs text-gray-500">{testimonial.role}</p>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1 mt-3">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-vocari-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
