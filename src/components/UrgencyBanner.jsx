import { useState, useEffect } from 'react';
import { X, Clock, Check } from 'lucide-react';

export default function UrgencyBanner() {
  const [show, setShow] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Mostrar banner después de 5 segundos
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!show) return;

    // Countdown de 24 horas (simulado)
    const endTime = new Date().getTime() + 24 * 60 * 60 * 1000;
    
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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 shadow-lg animate-in slide-in-from-top">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold">
              ¡Oferta de lanzamiento! 20% de descuento
            </p>
            <p className="text-sm opacity-90">
              Termina en:
            </p>
          </div>
          
          <div className="flex items-center gap-1 font-mono text-lg font-bold">
            <div className="bg-white/20 rounded px-2 py-1">
              {String(days).padStart(2, '0')}
            </div>
            <span>:</span>
            <div className="bg-white/20 rounded px-2 py-1">
              {String(hours).padStart(2, '0')}
            </div>
            <span>:</span>
            <div className="bg-white/20 rounded px-2 py-1">
              {String(minutes).padStart(2, '0')}
            </div>
            <span>:</span>
            <div className="bg-white/20 rounded px-2 py-1">
              {String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShow(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
