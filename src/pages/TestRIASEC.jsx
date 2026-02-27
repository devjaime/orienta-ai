import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { riasecQuestions, scaleLabels, validateResponses } from '../data/riasecQuestions';
import { getCurrentUser, supabase } from '../lib/supabase';
import SaturationAlert from '../components/SaturationAlert';
import { checkPartialTestSaturation } from '../lib/saturationChecker';

function TestRIASEC() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [startTime] = useState(Date.now());
  const [saturationAlert, setSaturationAlert] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [alertCheckpoint, setAlertCheckpoint] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Verificar saturación en el punto medio del test
  useEffect(() => {
    const MIDPOINT = 15;
    const answeredCount = Object.keys(responses).length;

    if (answeredCount >= MIDPOINT && !alertCheckpoint && !alertDismissed) {
      checkSaturation();
      setAlertCheckpoint(true);
    }
  }, [responses, alertCheckpoint, alertDismissed]);

  const checkSaturation = () => {
    const partialScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    Object.entries(responses).forEach(([questionId, value]) => {
      const question = riasecQuestions.find(q => q.id === questionId);
      if (question) {
        partialScores[question.dimension] += value;
      }
    });

    const result = checkPartialTestSaturation(partialScores);

    if (result.show && result.message) {
      setSaturationAlert(result.message);
    }
  };

  const checkAuth = async () => {
    // TEST PÚBLICO: No requerimos login
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < riasecQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    const validation = validateResponses(responses);

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const duracion = Math.round((Date.now() - startTime) / 60000);
    sessionStorage.setItem('test_responses', JSON.stringify(responses));
    sessionStorage.setItem('test_duration', duracion.toString());
    sessionStorage.setItem('test_user_id', user?.id || 'anonymous');

    navigate('/resultados');
  };

  const question = riasecQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / riasecQuestions.length) * 100;
  const answeredCount = Object.keys(responses).length;

  return (
    <div className="min-h-screen bg-vocari-bg">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-vocari-dark">Test Vocacional RIASEC</h1>
              <p className="text-sm text-gray-500">
                Pregunta {currentQuestion + 1} de {riasecQuestions.length}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>{answeredCount} respondidas</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-vocari-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {saturationAlert && !alertDismissed && (
          <div className="mb-6">
            <SaturationAlert
              careerName={saturationAlert.careers?.[0]?.career || 'las carreras de tu perfil'}
              saturationLevel={saturationAlert.type === 'critical' ? 'crítica' : saturationAlert.type === 'warning' ? 'alta' : 'media'}
              show={true}
              onDismiss={() => setAlertDismissed(true)}
            />
            {saturationAlert.message && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 leading-relaxed">
                  <strong className="font-semibold">{saturationAlert.title}</strong>
                  <br />
                  {saturationAlert.message}
                </p>
              </div>
            )}
          </div>
        )}

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
        >
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-vocari-primary/10 text-vocari-primary text-xs font-semibold rounded-full">
              Dimensión {question.dimension}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-vocari-dark mb-8">
            {question.text}
          </h2>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(value => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleResponse(question.id, value)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  responses[question.id] === value
                    ? 'border-vocari-primary bg-vocari-primary/10 text-vocari-dark'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        responses[question.id] === value
                          ? 'border-vocari-primary bg-vocari-primary'
                          : 'border-gray-400'
                      }`}
                    >
                      {responses[question.id] === value && (
                        <Check size={16} className="text-white" />
                      )}
                    </div>
                    <span className="font-medium">{scaleLabels[value]}</span>
                  </div>
                  <span className="text-2xl">{value}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <motion.button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={currentQuestion > 0 ? { scale: 1.02 } : {}}
            whileTap={currentQuestion > 0 ? { scale: 0.98 } : {}}
          >
            <ChevronLeft size={20} />
            Anterior
          </motion.button>

          {currentQuestion === riasecQuestions.length - 1 ? (
            <motion.button
              onClick={handleSubmit}
              disabled={answeredCount < riasecQuestions.length}
              className="flex items-center gap-2 px-8 py-3 bg-vocari-primary text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Ver Resultados
              <Check size={20} />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-vocari-primary text-white rounded-lg hover:bg-vocari-primary/80 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Siguiente
              <ChevronRight size={20} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestRIASEC;
