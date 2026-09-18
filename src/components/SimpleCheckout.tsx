import { useState, useEffect } from 'react';
import { FileText, Check, Loader, AlertCircle } from 'lucide-react';
import { getCurrentUser, getLatestTestResult } from '../lib/supabase';
import { createCheckoutSession } from '../lib/reportService';

const PLAN_FEATURES = {
  esencial: {
    title: 'Plan Esencial',
    price: '$10.990 CLP',
    features: [
      'Informe PDF completo de 10+ páginas',
      'Análisis RIASEC detallado',
      '10 carreras recomendadas MINEDUC',
      'Revisión por orientador'
    ]
  },
  premium: {
    title: 'Plan Premium',
    price: '$14.990 CLP',
    features: [
      'Informe PDF de 15+ páginas',
      'Análisis RIASEC con visuales',
      '20 carreras + proyección laboral',
      'Video-explicación personalizada',
      'Sesión de seguimiento 30 min'
    ]
  }
};

function resolvePlanKey(plan) {
  if (!plan) return 'esencial';
  if (typeof plan === 'string') {
    if (plan === 'premium' || plan === 'esencial') return plan;
    return 'esencial';
  }
  const name = plan.name || plan.id;
  if (name === 'premium' || name === 'esencial') return name;
  return 'esencial';
}

function resolvePlanId(plan) {
  if (!plan) return 'esencial';
  if (typeof plan === 'string') return plan;
  return plan.id || plan.name || 'esencial';
}

export default function SimpleCheckout({ plan = 'esencial', user: userProp, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [user, setUser] = useState(userProp || null);

  const planKey = resolvePlanKey(plan);
  const planId = resolvePlanId(plan);
  const planData = PLAN_FEATURES[planKey] || PLAN_FEATURES.esencial;

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = async () => {
    try {
      const [latestTest, currentUser] = await Promise.all([
        getLatestTestResult(),
        userProp ? Promise.resolve(userProp) : getCurrentUser()
      ]);
      setTestResult(latestTest);
      if (currentUser) setUser(currentUser);
    } catch (err) {
      console.error('Error loading checkout context:', err);
    }
  };

  const handlePay = async () => {
    setError(null);
    setLoading(true);

    try {
      const currentUser = user || (await getCurrentUser());
      if (!currentUser) {
        setError('Debes iniciar sesión para pagar tu informe.');
        setLoading(false);
        return;
      }

      if (!testResult) {
        setError('Primero completa el test vocacional para generar tu informe.');
        setLoading(false);
        return;
      }

      const session = await createCheckoutSession(planId, {
        userId: currentUser.id,
        userEmail: currentUser.email
      });

      if (onSuccess) onSuccess(session);
      window.location.href = session.url;
    } catch (err) {
      console.error('Error creating Flow checkout:', err);
      setError(
        err?.message ||
          'No pudimos iniciar el pago con Flow.cl. Verifica la configuración o intenta más tarde.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-vocari-primary to-vocari-light p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{planData.title}</h2>
            <p className="text-3xl font-black mt-1">{planData.price}</p>
          </div>
          <FileText size={48} className="opacity-50" />
        </div>
      </div>

      <div className="p-6">
        <ul className="space-y-3 mb-6">
          {planData.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <Check size={20} className="text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 bg-vocari-primary hover:bg-vocari-light text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Redirigiendo a Flow...
            </>
          ) : (
            <>💳 Pagar con Flow (WebPay y más)</>
          )}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          🔒 Pago seguro con Flow.cl. WebPay, tarjetas y transferencias.
        </p>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
