import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { riasecQuestions, scaleLabels, validateResponses } from '../data/riasecQuestions';
import GoogleSignIn from '../components/GoogleSignIn';
import { getCurrentUser, supabase } from '../lib/supabase';

function TestRIASEC() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [startTime] = useState(Date.now());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Verificar si el usuario completó su perfil
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking profile:', error);
    }

    if (!profile) {
      // No tiene perfil completo, redirigir a completar perfil
      navigate('/complete-profile');
    }
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

    // Calcular duración
    const duracion = Math.round((Date.now() - startTime) / 60000); // minutos

    // Guardar respuestas y navegar a resultados
    sessionStorage.setItem('test_responses', JSON.stringify(responses));
    sessionStorage.setItem('test_duration', duracion.toString());

    navigate('/resultados');
  };

  const question = riasecQuestions[currentQuestion];
  const isAnswered = responses[question.id] !== undefined;
  const progress = ((currentQuestion + 1) / riasecQuestions.length) * 100;
  const answeredCount = Object.keys(responses).length;

  // Modal de autenticación
  if (showAuthModal && !user) {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 max-w-md w-full"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Antes de comenzar...</h2>
          <p className="text-white/80 mb-6">
            Inicia sesión con Google para guardar tu resultado y poder consultarlo después.
          </p>

          <GoogleSignIn
            onAuthChange={(user) => {
              if (user) {
                setUser(user);
                setShowAuthModal(false);
              }
            }}
          />

          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full text-sm text-white/60 hover:text-white transition-colors"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orienta-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-orienta-dark to-orienta-blue/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Test Vocacional RIASEC</h1>
              <p className="text-sm text-white/60">
                Pregunta {currentQuestion + 1} de {riasecQuestions.length}
              </p>
            </div>

            {user && (
              <div className="flex items-center gap-2">
                <img
                  src={user.user_metadata?.avatar_url}
                  alt={user.user_metadata?.full_name}
                  className="w-8 h-8 rounded-full border-2 border-white/30"
                />
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-white/60 mb-2">
              <span>{answeredCount} respondidas</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-orienta-blue to-green-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8"
        >
          {/* Dimension badge */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-orienta-blue/20 text-orienta-blue text-xs font-semibold rounded-full">
              Dimensión {question.dimension}
            </span>
          </div>

          {/* Question text */}
          <h2 className="text-2xl font-bold text-white mb-8">
            {question.text}
          </h2>

          {/* Scale */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(value => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleResponse(question.id, value)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  responses[question.id] === value
                    ? 'border-orienta-blue bg-orienta-blue/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        responses[question.id] === value
                          ? 'border-orienta-blue bg-orienta-blue'
                          : 'border-white/40'
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
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>

          {currentQuestion === riasecQuestions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={answeredCount < riasecQuestions.length}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orienta-blue to-green-400 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Ver Resultados
              <Check size={20} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-orienta-blue text-white rounded-lg hover:bg-orienta-blue/80 transition-all"
            >
              Siguiente
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestRIASEC;
