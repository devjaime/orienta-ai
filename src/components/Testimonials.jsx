import { Star, Quote } from 'lucide-react';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { t, tx } from '../lib/i18n/translations';

const Testimonials = () => {
  const { lang } = useLanguage();
  const testimonials = [
    {
      name: "María González",
      role: tx(t.testimonials.r1role, lang),
      text: tx(t.testimonials.r1text, lang),
      rating: 5,
      avatar: "👩‍👦"
    },
    {
      name: "Carlos Mendoza",
      role: tx(t.testimonials.r2role, lang),
      text: tx(t.testimonials.r2text, lang),
      rating: 5,
      avatar: "🎨"
    },
    {
      name: "Patricia Rojas",
      role: tx(t.testimonials.r3role, lang),
      text: tx(t.testimonials.r3text, lang),
      rating: 5,
      avatar: "📚"
    },
    {
      name: "Javier Torres",
      role: tx(t.testimonials.r4role, lang),
      text: tx(t.testimonials.r4text, lang),
      rating: 5,
      avatar: "🚀"
    },
    {
      name: "Andrea Valenzuela",
      role: tx(t.testimonials.r5role, lang),
      text: tx(t.testimonials.r5text, lang),
      rating: 5,
      avatar: "💼"
    },
    {
      name: "Roberto Díaz",
      role: tx(t.testimonials.r6role, lang),
      text: tx(t.testimonials.r6text, lang),
      rating: 5,
      avatar: "👨"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
            {tx(t.testimonials.title, lang)}
          </h2>
          <p className="text-lg text-gray-600">
            {tx(t.testimonials.subtitle, lang)}
          </p>

          <div className="flex items-center justify-center gap-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-gray-600 ml-2">{tx(t.testimonials.rating, lang)}</span>
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
            {tx(t.testimonials.ctaText, lang)}
          </p>
          <button
            onClick={() => window.location.href = '/test'}
            className="px-8 py-3 bg-vocari-primary text-white font-bold rounded-xl hover:bg-vocari-light transition-colors"
          >
            {tx(t.testimonials.ctaBtn, lang)}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
