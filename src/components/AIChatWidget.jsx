import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, X, Sparkles, Mail } from 'lucide-react'

// Constantes de configuración
const MAX_FREE_MESSAGES = 3
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-lite-001'
const STORAGE_KEY = 'vocari_chat_usage'

// Prompt del sistema para Vocari
const CHAT_SYSTEM_PROMPT = `Eres un asistente vocacional de Vocari.cl especializado en orientar a estudiantes chilenos sobre carreras profesionales.

Tu rol es:
- Ayudar a entender el test RIASEC y sus resultados
- Explicar las 6 áreas: Realista, Investigativo, Artístico, Social, Empresarial, Convencional
- Dar información sobre carreras con datos del mercado laboral chileno
- Ser empático, corto y directo (máximo 2-3 oraciones por respuesta)

Nunca des advice financiero ni sustituyas orientación profesional certificada.
Responde en español, de forma breve y amigable.`

// Función para verificar y actualizar uso de chat
function getChatUsage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return { count: 0, blocked: false, firstUse: null }
  } catch {
    return { count: 0, blocked: false, firstUse: null }
  }
}

function updateChatUsage(usage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage))
  } catch (e) {
    console.error('Error saving chat usage:', e)
  }
}

// Función para llamar a OpenRouter (modelo reducido)
async function callOpenRouter(messages) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error('API no disponible')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://vocari.cl',
      'X-Title': 'Vocari.cl',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error('Error en API')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export default function AIChatWidget() {
  // Estado inicial con verificación de uso
  const [chatUsage, setChatUsage] = useState(getChatUsage)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy Vocari IA. Puedo responder 3 preguntas gratis sobre tu perfil vocacional, carreras y el test RIASEC. ¿En qué te ayudo?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const messagesEndRef = useRef(null)

  const isBlocked = chatUsage.count >= MAX_FREE_MESSAGES

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading || isBlocked) return

    const userMessage = input.trim()
    setInput('')
    setError(null)

    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      abortRef.current = new AbortController()

      // Llamar a OpenRouter con modelo reducido
      const response = await callOpenRouter(
        [...messages.filter(m => m.role !== 'system'), { role: 'user', content: userMessage }],
        abortRef.current.signal
      )

      // Actualizar contador
      const newUsage = {
        count: chatUsage.count + 1,
        blocked: chatUsage.count + 1 >= MAX_FREE_MESSAGES,
        firstUse: chatUsage.firstUse || new Date().toISOString()
      }
      updateChatUsage(newUsage)
      setChatUsage(newUsage)

      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Respuesta cancelada.' 
        }])
      } else {
        setError(err.message)
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Tuve un problema técnico. Escríbenos a hola@vocari.cl para resolver tus dudas sobre tu futuro vocacional.' 
        }])
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const resetChat = () => {
    const newUsage = { count: 0, blocked: false, firstUse: null }
    updateChatUsage(newUsage)
    setChatUsage(newUsage)
    setMessages([
      {
        role: 'assistant',
        content: '¡Hola! 👋 Soy Vocari IA. Puedo responder 3 preguntas gratis sobre tu perfil vocacional. ¿En qué te ayudo?'
      }
    ])
  }

  const remainingMessages = MAX_FREE_MESSAGES - chatUsage.count

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-vocari-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={24} />
          </motion.div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-vocari-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Vocari IA</h3>
                  <p className="text-xs text-white/80">
                    {isBlocked ? '🔒 Límite alcanzado' : `💬 ${remainingMessages} preguntas gratis`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-vocari-accent' : 'bg-vocari-primary'
                  }`}>
                    {msg.role === 'user' ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <Bot size={16} className="text-white" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-vocari-accent text-white' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-vocari-primary flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                    <Loader2 size={16} className="animate-spin text-vocari-primary" />
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input or Blocked Message */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {isBlocked ? (
                <div className="text-center space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-800 text-sm font-medium">
                      ⚠️ Has alcanzado el límite de 3 preguntas gratis
                    </p>
                    <p className="text-amber-700 text-xs mt-1">
                      Para继续 con orientación personalizada:
                    </p>
                  </div>
                  <a 
                    href="mailto:hola@vocari.cl?subject=Consulta%20Vocacional&body=Hola,%20quiero%20más%20información%20sobre..."
                    className="flex items-center justify-center gap-2 w-full py-2 bg-vocari-primary text-white rounded-lg hover:bg-vocari-light transition-colors text-sm"
                  >
                    <Mail size={16} />
                    Contactar a Vocari
                  </a>
                  <button 
                    onClick={resetChat}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Reiniciar chat (para prueba)
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Escribe tu pregunta..."
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-vocari-primary focus:ring-1 focus:ring-vocari-primary text-sm"
                    />
                    <motion.button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="bg-vocari-primary text-white p-2 rounded-full disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Send size={20} />
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    🤖 IA • {remainingMessages} preguntas restantes
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
