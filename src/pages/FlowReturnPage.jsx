import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, FileText, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

function FlowReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading, success, pending, error

  useEffect(() => {
    // Flow redirige al usuario aquí después del pago
    // La confirmación real viene por el webhook (flow-webhook)
    // Esta página solo muestra un mensaje al usuario
    if (token) {
      // Asumimos éxito ya que Flow solo redirige aquí si el usuario completó el flujo
      // El webhook se encarga de la confirmación real
      setStatus('success');
    } else {
      setStatus('pending');
    }
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-orienta-blue animate-spin mx-auto mb-4" />
          <p className="text-white/60">Verificando pago...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={48} className="text-green-400" />
          </motion.div>

          <h1 className="text-3xl font-poppins font-bold text-white mb-4">
            ¡Pago procesado!
          </h1>

          <p className="text-white/80 text-lg mb-8">
            Tu informe vocacional está siendo generado y será revisado por nuestro equipo de orientadores calificados.
          </p>

          <div className="bg-white/5 border border-white/20 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-white font-semibold mb-4">Próximos pasos:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Pago recibido</p>
                  <p className="text-white/60 text-sm">Tu pago fue procesado correctamente vía WebPay</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orienta-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-orienta-blue" />
                </div>
                <div>
                  <p className="text-white font-medium">Generación del informe</p>
                  <p className="text-white/60 text-sm">Estamos generando tu informe personalizado con IA</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-white/40" />
                </div>
                <div>
                  <p className="text-white/60 font-medium">Revisión por orientadores</p>
                  <p className="text-white/40 text-sm">Un orientador calificado revisará y aprobará tu informe</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/mis-informes')}
            className="w-full bg-orienta-blue text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-400 transition-colors flex items-center justify-center gap-2"
          >
            Ver mis informes
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate('/')}
            className="mt-4 text-white/60 hover:text-white transition-colors"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  // Status pendiente o sin token (usuario llegó sin completar pago)
  return (
    <div className="min-h-screen bg-orienta-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Clock size={48} className="text-yellow-400" />
        </motion.div>

        <h1 className="text-3xl font-poppins font-bold text-white mb-4">
          Pago pendiente
        </h1>

        <p className="text-white/80 text-lg mb-8">
          No pudimos confirmar tu pago. Si completaste el proceso, tu informe
          aparecerá en "Mis Informes" una vez que se confirme el pago.
        </p>

        <button
          onClick={() => navigate('/informes')}
          className="w-full bg-orienta-blue text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-400 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <ArrowLeft size={18} />
          Volver a los planes
        </button>

        <button
          onClick={() => navigate('/mis-informes')}
          className="text-orienta-blue hover:text-blue-300 transition-colors"
        >
          Ver mis informes
        </button>
      </motion.div>
    </div>
  );
}

export default FlowReturnPage;
