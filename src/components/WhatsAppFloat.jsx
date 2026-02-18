import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

const WHATSAPP_NUMBER = '56912345678'; // Reemplazar con número real

export default function WhatsAppFloat() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    const message = encodeURIComponent('Hola! Me interesa el informe vocacional de Vocari. ¿Cómo puedo comprar?');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-pulse"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Menú expandido */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl p-4 mb-4 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-gray-800">💬 ¿Te ayudamos?</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Chatea con nosotros para resolver tus dudas sobre los informes vocacionales.
          </p>
          <button
            onClick={handleClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle size={20} />
            Escribir en WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
