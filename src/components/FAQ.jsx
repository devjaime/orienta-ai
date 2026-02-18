const faqs = [
  {
    question: "¿Cuánto tiempo tarda el informe?",
    answer: "El informe se entrega en 24-48 horas hábiles después de completar el test. El plan Premium incluye video-explicación personalizada."
  },
  {
    question: "¿Qué incluye el informe?",
    answer: "Análisis RIASEC completo, 10-20 carreras recomendadas con datos reales de empleabilidad MINEDUC, puntajes de compatibilidad, y recomendaciones personalizadas."
  },
  {
    question: "¿Es seguro pagar con PayPal?",
    answer: "Sí, PayPal protege tu compra. Si no estás satisfecho, puedes solicitar reembolso dentro de 30 días."
  },
  {
    question: "¿Puedo pedir cambios en el informe?",
    answer: "Sí, garantizamos revisión ilimitada hasta que quedes satisfecho con tu informe vocacional."
  },
  {
    question: "¿Qué datos necesito para el test?",
    answer: "Solo necesitas responder las preguntas sobre tus intereses, habilidades y preferencias laborales. Takes 15-20 minutos."
  },
  {
    question: "¿El informe sirve para Chile?",
    answer: "Sí, usamos datos oficiales del MINEDUC sobre carreras, vacantes, remuneraciones y empleabilidad en Chile."
  }
];

export default function FAQ() {
  return (
    <section className="py-16 bg-vocari-bg">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-poppins font-bold text-vocari-dark text-center mb-8">
          ❓ Preguntas Frecuentes
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details 
              key={index}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm open:shadow-md transition-shadow"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-vocari-dark list-none">
                {faq.question}
                <span className="text-vocari-primary transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="px-5 pb-5 text-gray-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            ¿Otra pregunta?{' '}
            <button 
              onClick={() => window.open('https://wa.me/56912345678', '_blank')}
              className="text-vocari-primary hover:underline font-medium"
            >
              Chatea con nosotros
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
