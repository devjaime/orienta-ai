import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Brain, Target, Heart, Loader2, AlertCircle } from 'lucide-react';
import { canUseChatAI, recordChatAIUsage, getLimitMessages, isAIEnabled, LIMITS } from '../lib/usageLimits';

const AIChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: isAIEnabled()
        ? '¡Hola! Soy Vocari, tu asistente de orientación vocacional con IA. 🤖✨\n\nEstoy aquí para ayudarte a descubrir tu camino profesional. ¿Te gustaría que empecemos con algunas preguntas para conocerte mejor?'
        : '👋 ¡Hola! Soy Vocari.\n\n🔒 Las funcionalidades de IA están actualmente desactivadas en esta demo.\n\nPara acceso completo con análisis personalizados ilimitados, contáctanos en ' + LIMITS.CONTACT_EMAIL,
      timestamp: new Date(),
      avatar: '🧭'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [chatLimitReached, setChatLimitReached] = useState(!canUseChatAI());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const questions = [
    {
      id: 1,
      question: "¿Qué actividades te hacen perder la noción del tiempo?",
      category: "interests"
    },
    {
      id: 2,
      question: "¿En qué materias del colegio te va mejor?",
      category: "academics"
    },
    {
      id: 3,
      question: "¿Qué problemas del mundo te gustaría resolver?",
      category: "values"
    },
    {
      id: 4,
      question: "¿Prefieres trabajar solo o en equipo?",
      category: "personality"
    },
    {
      id: 5,
      question: "¿Te gusta más crear cosas nuevas o mejorar las existentes?",
      category: "workstyle"
    }
  ];

  const generateAIResponse = async (userMessage) => {
    setIsTyping(true);
    
    // Simular tiempo de respuesta de IA
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    let response = '';
    const currentQuestion = questions[currentStep];

    if (currentStep < questions.length) {
      // Respuesta a pregunta específica
      response = `¡Excelente respuesta! 🎯\n\nAhora te pregunto: ${currentQuestion.question}`;
      setCurrentStep(currentStep + 1);
    } else {
      // Análisis final
      response = `¡Perfecto! He analizado todas tus respuestas con mi IA. 🧠✨\n\n**Tu perfil vocacional:**\n\n🎯 **Áreas de interés:** Tecnología y Ciencias\n💡 **Fortalezas:** Pensamiento analítico y creatividad\n🌟 **Valores:** Impacto social y innovación\n\n**Carreras recomendadas:**\n• Ingeniería en Informática\n• Ciencia de Datos\n• Diseño UX/UI\n• Emprendimiento Tecnológico\n\n¿Te gustaría que profundice en alguna de estas opciones?`;
    }

    const newMessage = {
      id: Date.now(),
      type: 'ai',
      content: response,
      timestamp: new Date(),
      avatar: '🧭'
    };

    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    // Verificar si la IA está habilitada
    if (!isAIEnabled()) {
      const warningMessage = {
        id: Date.now(),
        type: 'ai',
        content: '🔒 Las funcionalidades de IA están desactivadas en esta demo.\n\nPara acceso completo, contáctanos en ' + LIMITS.CONTACT_EMAIL,
        timestamp: new Date(),
        avatar: '🧭'
      };
      setMessages(prev => [...prev, warningMessage]);
      return;
    }

    // Verificar límite de mensajes
    if (!canUseChatAI()) {
      setChatLimitReached(true);
      const limitMsg = getLimitMessages().chatLimit;
      const limitMessage = {
        id: Date.now(),
        type: 'ai',
        content: '🔒 ' + limitMsg.message,
        timestamp: new Date(),
        avatar: '🧭'
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      avatar: '👤'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Registrar uso de chat
    recordChatAIUsage();

    await generateAIResponse(inputValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickResponses = [
    "Me gusta la tecnología",
    "Soy bueno en matemáticas",
    "Quiero ayudar a otros",
    "Prefiero trabajar solo",
    "Me gusta crear cosas nuevas"
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] max-h-[600px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orienta-blue to-orienta-dark text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Vocari</h3>
              <p className="text-sm text-white/80">Orientación Vocacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAIEnabled() && !chatLimitReached && (
              <div className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
                <Sparkles size={12} />
                <span>{getLimitMessages().chatLimit.remaining} mensajes gratis</span>
              </div>
            )}
            {isAIEnabled() && (
              <div className="flex items-center gap-1 text-xs">
                <div className={`w-2 h-2 ${chatLimitReached ? 'bg-red-400' : 'bg-green-400'} rounded-full ${!chatLimitReached && 'animate-pulse'}`}></div>
                <span className="hidden sm:inline">{chatLimitReached ? 'Límite alcanzado' : 'IA Activa'}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-orienta-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {message.avatar}
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-orienta-blue text-white'
                      : 'bg-white shadow-sm border'
                  }`}
                >
                  <div className="whitespace-pre-line text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm">
                    {message.avatar}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 bg-orienta-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
                🧭
              </div>
              <div className="bg-white shadow-sm border p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-orienta-blue" />
                  <span className="text-sm text-gray-600">Vocari está pensando...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Responses */}
        {messages.length === 1 && !isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t bg-white"
          >
            <p className="text-sm text-gray-600 mb-3">Respuestas rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {quickResponses.map((response, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setInputValue(response);
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="px-3 py-2 bg-orienta-blue/10 text-orienta-blue rounded-full text-sm hover:bg-orienta-blue/20 transition-colors"
                >
                  {response}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input */}
        <div className="p-4 border-t bg-white">
          {chatLimitReached && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                Has alcanzado el límite de mensajes gratuitos. Para continuar, contáctanos en{' '}
                <a href={'mailto:' + LIMITS.CONTACT_EMAIL} className="underline font-semibold">
                  {LIMITS.CONTACT_EMAIL}
                </a>
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={chatLimitReached ? 'Límite alcanzado...' : 'Escribe tu respuesta...'}
                className="w-full p-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:border-orienta-blue focus:ring-2 focus:ring-orienta-blue/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
                rows="1"
                disabled={isTyping || chatLimitReached || !isAIEnabled()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping || chatLimitReached || !isAIEnabled()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-orienta-blue text-white rounded-full flex items-center justify-center hover:bg-orienta-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIChat; 