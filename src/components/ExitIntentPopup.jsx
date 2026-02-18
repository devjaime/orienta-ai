import { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Detectar mouse saliendo de la ventana
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !localStorage.getItem('exitIntentShown')) {
        setShow(true);
        localStorage.setItem('exitIntentShown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Guardar email (en producción sería a una DB)
    console.log('Email captured:', email);
    setShow(false);
    alert('¡Gracias! Te enviaremos un descuento especial.');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 relative animate-in zoom-in-95">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={32} className="text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-vocari-dark mb-2">
            ¡Espera! 🎁
          </h3>
          
          <p className="text-gray-600 mb-6">
            Antes de irte, ingresa tu email y obtén un <strong>20% de descuento</strong> en tu informe vocacional.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vocari-primary focus:outline-none"
            />
            
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Obtener Descuento 🎟️
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-4">
            Solo te mandaremos algo útil, nunca spam.
          </p>
        </div>
      </div>
    </div>
  );
}
