import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, Settings, X, Sparkles } from 'lucide-react'

// Initialize WebLLM engine
let engine = null
let isInitialized = false

const CHAT_SYSTEM_PROMPT = `Eres un asistente vocacional especializado en orientar a estudiantes chilenos sobre carreras profesionales. 

Tu rol es:
- Ayudar a entender el test RIASEC y sus resultados
- Explicar las diferentes áreas profesionales (Realista, Investigativo, Artístico, Social, Empresarial, Convencional)
- Dar información sobre carreras basadas en datos del mercado laboral chileno
- Ser empático y motivador

Nunca debes:
- Dar advice financiero específico
- Sustituir la orientación de un profesional certificado
- Hacer promesas sobre empleabilidad específica

Respondé siempre en español de manera clara y amigable.`

async function initializeLLM() {
  if (isInitialized) return engine
  
  try {
    // Use a lighter model for browser compatibility
    const initProgressCallback = (report) => {
      console.log('LLM Init:', report.text)
    }
    
    engine = await webllm.CreateMLCEngine(
      'Llama-3.1-8B-Instruct-q4f32_1', // Smaller model for browser
      {
        initProgressCallback,
        logLevel: 'ERROR',
      }
    )
    
    isInitialized = true
    return engine
  } catch (error) {
    console.error('Failed to initialize WebLLM:', error)
    throw error
  }
}

async function generateResponse(messages, signal) {
  const llm = await initializeLLM()
  
  const messagesForLLM = messages.map(m => ({
    role: m.role,
    content: m.content
  }))

  const chunks = []
  
  const completion = await llm.chat.completions.create({
    messages: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      ...messagesForLLM
    ],
    temperature: 0.7,
    max_tokens: 512,
    stream: true,
  }, { signal })

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) chunks.push(content)
  }

  return chunks.join('')
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy el asistente de Vocari. Puedo ayudarte a entender mejor tu perfil vocacional, explicarte qué significan los resultados del test RIASEC, o darte información sobre carreras. ¿En qué puedo ayudarte?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const abortRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Initialize on first message if needed
      if (!modelLoaded) {
        setIsModelLoading(true)
        await initializeLLM()
        setModelLoaded(true)
        setIsModelLoading(false)
      }

      abortRef.current = new AbortController()

      const response = await generateResponse(
        [...messages, { role: 'user', content: userMessage }],
        abortRef.current.signal
      )

      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'La respuesta fue cancelada.' 
        }])
      } else {
        setError(err.message)
        // Fallback message
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Lo siento, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo. Si el problema persiste, puedes contactar a hola@vocari.cl' 
        }])
      }
    } finally {
      setIsLoading(false)
      setIsModelLoading(false)
      abortRef.current = null
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
                  <h3 className="font-semibold text-white">Asistente Vocacional</h3>
                  <p className="text-xs text-white/80">
                    {modelLoaded ? '🟢 Listo' : isModelLoading ? '🔄 Cargando modelo...' : '⚪离线'}
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

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
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
                🤖 AI correr localmente en tu navegador • Sin costo
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
