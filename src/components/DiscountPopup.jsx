import { useState, useEffect } from 'react';
import { X, Clock, Gift } from 'lucide-react';

export default function DiscountPopup() {
  const [show, setShow] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Mostrar después de 30 segundos
    const timer = setTimeout(() => setShow(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!show) return;

    // Countdown de 2 horas (simulado)
    const endTime = new Date().getTime() + 2 * 60 * 60 * 1000;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      setDays(Math.floor(distance / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setMinutes(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
      setSeconds(Math.floor((distance % (1000 * 60)) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const handleClose = () => {
    setShow(false);
    // Volver a mostrar en 1 hora
    setTimeout(() => {
      if (!localStorage.getItem('discountClaimed')) {
        setShow(true);
      }
    }, 60 * 60 * 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 relative animate-in zoom-in-95">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gift size={40} className="text-white" />
          </div>
          
          <h3 className="text-2xl font-black text-vocari-dark mb-2">
            ¡Última Oportunidad! 🎁
          </h3>
          
          <p className="text-gray-600 mb-4">
            <strong className="text-orange-500">20% DE DESCUENTO</strong> en tu informe vocacional.
            <br />¡Solo por hoy!
          </p>

          {/* Countdown */}
          <div className="flex justify-center gap-2 mb-6">
            <div className="bg-orange-100 rounded-lg p-3 text-center min-w-[60px]">
              <div className="text-2xl font-bold text-orange-600">{String(hours).padStart(2, '0')}</div>
              <div className="text-xs text-orange-400">horas</div>
            </div>
            <div className="bg-orange-100 rounded-lg p-3 text-center min-w-[60px]">
              <div className="text-2xl font-bold text-orange-600">{String(minutes).padStart(2, '0')}</div>
              <div className="text-xs text-orange-400">min</div>
            </div>
            <div className="bg-orange-100 rounded-lg p-3 text-center min-w-[60px]">
              <div className="text-2xl font-bold text-orange-600">{String(seconds).padStart(2, '0')}</div>
              <div className="text-xs text-orange-400">seg</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Precio especial:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-gray-400 line-through">$20</span>
              <span className="text-4xl font-black text-orange-500">$12</span>
              <span className="text-gray-500">USD</span>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.setItem('discountClaimed', 'true');
              window.open('https://www.paypal.com/ncp/payment/DCEGNNL4FVNHA', '_blank');
            }}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            ¡Aprovechar Descuento! 🎟️
          </button>

          <p className="text-xs text-gray-400 mt-4">
            <Clock className="inline w-3 h-3 mr-1" />
            Oferta válida solo para nuevos clientes
          </p>
        </div>
      </div>
    </div>
  );
}
