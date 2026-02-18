"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ShieldCheck, Check, Loader2 } from 'lucide-react';

// PayPal NCP Payment Links (configurados por Jaime)
const PAYMENT_LINKS = {
  esencial: 'https://www.paypal.com/ncp/payment/DCEGNNL4FVNHA',
  premium: 'https://www.paypal.com/ncp/payment/4CB6YZZS7G5VQ',
};

export default function SimpleCheckout({ plan = 'esencial', price = 10990, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('paypal');

  const handlePayPalPayment = async () => {
    setLoading(true);
    
    // Simular creación de orden (en producción, esto llamaría a tu backend)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirigir a PayPal
    const paymentLink = PAYMENT_LINKS[plan] || 'https://www.paypal.com/ncp/payment/YOUR_LINK';
    
    // En producción, aquí crearías la orden en tu backend y obtener el token de PayPal
    window.location.href = paymentLink;
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Plan Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-vocari-dark mb-4">Resumen del pedido</h3>
        
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600">
            {plan === 'premium' ? 'Plan Premium' : 'Plan Esencial'}
          </span>
          <span className="font-bold text-vocari-dark">${price.toLocaleString('es-CL')} CLP</span>
        </div>
        
        <div className="flex justify-between items-center py-3">
          <span className="font-semibold text-vocari-dark">Total</span>
          <span className="text-xl font-bold text-vocari-primary">${price.toLocaleString('es-CL')} CLP</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-vocari-dark mb-4">Método de pago</h3>
        
        <div className="space-y-3">
          {/* PayPal Option */}
          <label 
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMethod === 'paypal' 
                ? 'border-vocari-primary bg-vocari-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={selectedMethod === 'paypal'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-4 h-4 text-vocari-primary"
              />
              <div className="flex items-center gap-2">
                {/* PayPal Logo */}
                <svg viewBox="0 0 1024 1024" className="w-8 h-8" fill="#003087">
                  <path d="M443.6 520.4c-18.4-2.4-33.8-8.8-45.2-18.8-11-9.6-17.4-22.4-19.2-38-1.6-15.6 2.2-30.4 11.4-43.8 9.4-13.6 24-21.8 43.2-24.4l68.8-9.2c25.6-3.4 51.2 4.6 69.6 21.8 17.8 16.6 24.4 41 17.8 64.4-6.4 22.8-24.4 38.8-47.6 42.2l-61.2 8.2c-4.6.6-9.2 1-13.8 1.2zm-62-94.4c-13.6-1.8-27.6 2.4-37.8 11-9.6 8.2-14.2 20.2-12.4 32.2 1.6 10.8 7.6 19.8 16.2 24.2 8.8 4.6 19.4 4.2 28.6-.8 9.2-5 15.6-14.2 17-24.4 1.6-11.6-2.8-23.2-11.6-29.2-1.6-1.2-3.4-2.2-5.2-3-1.2-.6-2.6-1-4-1.4l.4.4zM924.4 541.8l-67.2-52.8c-11.4-8.8-28.6-8.8-40 0l-28.4 22.4c-2.2 1.8-5.2 1.8-7.4 0l-27.2-21.4c-11.4-8.8-28.6-8.8-40 0L716.4 516c-15.6 12.4-38.4 12.4-54 0l-67.2-52.8c-11.4-8.8-28.6-8.8-40 0l-28.4 22.4c-2.2 1.8-5.2 1.8-7.4 0l-67.2-52.8c-11.4-8.8-28.6-8.8-40 0L435.6 458c-15.6 12.4-38.4 12.4-54 0l-67.2-52.8c-11.4-8.8-28.6-8.8-40 0l-28.4 22.4c-2.2 1.8-5.2 1.8-7.4 0l-27.2-21.4c-11.4-8.8-28.6-8.8-40 0L235.2 431.8c-15.6 12.4-38.4 12.4-54 0l-67.2-52.8c-11.4-8.8-28.6-8.8-40 0L56.4 401c-2.2 1.8-5.2 1.8-7.4 0L22.6 374.6c-1.6-1.4-.4-3.8 1.8-3.8h134.4c2.2 0 4-1.8 4-4V235.4c0-2.2 1.8-4 4-4h67.2c2.2 0 4 1.8 4 4v131.4c0 2.2-1.8 4-4 4H178l27.2 21.4c1.6 1.2 3.8.4 4.8-1.2l26.8-41.2c1-1.6.2-3.8-1.4-4.8l-67.2-52.8c-1.4-1.2-1.4-3.4 0-4.8l28.4-22.4c1.2-1 3.2-.8 4.2.4l26.4 33.4c.8 1 2.2 1.2 3.2.4l27.2-21.4c1.2-1 3.2-.8 4.2.4l26.4 33.4c.8 1 2.2 1.2 3.2.4l27.2-21.4c1.2-1 3.2-.8 4.2.4l26.4 33.4c.8 1 2.2 1.2 3.2.4l27.2-21.4c1.2-1 3.2-.8 4.2.4l67.2 84c.8 1 2.2 1.2 3.2.4l27.2-21.4c1.2-1 3.2-.8 4.2.4l26.4 33.4c.8 1 2.2 1.2 3.2.4l27.2-21.4c1.2-1 3.2-.8 4.2.4l26.4 33.4c.8 1 2.2 1.2 3.2.4l27.2-21.4c1.2-1 3.2-.8 4.2.4l26.4 33.4c.8 1 2.2 1.2 3.2.4l27.2-21.4c1.2-1 3.2-.8 4.2.4l26.4 33.4c.8 1 2.2 1.2 3.2.4l27.2-21.4c1.2-1 3.2-.8 4.2.4l67.2 84c.8 1 2.2 1.2 3.2.4l26.4-20.8c1.2-1 3.2-.8 4.2.4l33.2 41.8c1 1.2 2.6 1.4 3.8.4l28.4-22.4c1.4-1 1.4-3 0-4L924.4 541.8z"/>
                </svg>
                <span className="font-medium text-gray-700">PayPal</span>
              </div>
            </div>
            {selectedMethod === 'paypal' && (
              <Check size={20} className="text-vocari-primary" />
            )}
          </label>

          {/* WebPay / Flow Option (Future) */}
          <label 
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all opacity-50 ${
              selectedMethod === 'webpay' 
                ? 'border-vocari-primary bg-vocari-primary/5' 
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="webpay"
                checked={selectedMethod === 'webpay'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-4 h-4 text-vocari-primary"
                disabled
              />
              <div className="flex items-center gap-2">
                <CreditCard size={24} className="text-gray-400" />
                <span className="font-medium text-gray-400">WebPay (Próximamente)</span>
              </div>
            </div>
          </label>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayPalPayment}
          disabled={loading || selectedMethod !== 'paypal'}
          className={`w-full mt-6 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
            selectedMethod === 'paypal'
              ? 'bg-vocari-accent text-vocari-dark-text hover:bg-yellow-600 hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              Procesando...
            </span>
          ) : (
            `Pagar $${price.toLocaleString('es-CL')} CLP`
          )}
        </button>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-sm">
          <ShieldCheck size={16} />
          <span>Pago seguro con PayPal</span>
        </div>

        {/* Direct PayPal Link */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 mb-2">¿Prefieres pagar directamente?</p>
          <a 
            href="https://www.paypal.com/ncp/payment/5CM4J3P78GDBC"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-vocari-primary hover:underline"
          >
            Ir a PayPal →
          </a>
        </div>
      </div>
    </div>
  );
}
