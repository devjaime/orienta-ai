/**
 * Sistema de control de límites de uso de funcionalidades IA
 * Gestiona cuotas gratuitas para demo
 */

const STORAGE_KEY = 'orienta_ai_usage';
const MAX_FREE_TESTS = 1;
const MAX_FREE_CHAT_MESSAGES = 5;
const CONTACT_EMAIL = 'hernandez.hs@gmail.com';

/**
 * Obtiene el estado actual de uso
 */
export function getUsageStats() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return {
        testsUsed: 0,
        chatMessagesUsed: 0,
        firstUsedAt: null
      };
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo usage stats:', err);
    return {
      testsUsed: 0,
      chatMessagesUsed: 0,
      firstUsedAt: null
    };
  }
}

/**
 * Actualiza el contador de uso
 */
function saveUsageStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Error guardando usage stats:', err);
  }
}

/**
 * Verifica si el usuario puede usar la explicación IA del test
 */
export function canUseTestAI() {
  const stats = getUsageStats();
  return stats.testsUsed < MAX_FREE_TESTS;
}

/**
 * Registra el uso de la explicación IA del test
 */
export function recordTestAIUsage() {
  const stats = getUsageStats();
  stats.testsUsed += 1;
  if (!stats.firstUsedAt) {
    stats.firstUsedAt = new Date().toISOString();
  }
  saveUsageStats(stats);
}

/**
 * Verifica si el usuario puede enviar mensajes de chat IA
 */
export function canUseChatAI() {
  const stats = getUsageStats();
  return stats.chatMessagesUsed < MAX_FREE_CHAT_MESSAGES;
}

/**
 * Registra el uso de un mensaje de chat IA
 */
export function recordChatAIUsage() {
  const stats = getUsageStats();
  stats.chatMessagesUsed += 1;
  if (!stats.firstUsedAt) {
    stats.firstUsedAt = new Date().toISOString();
  }
  saveUsageStats(stats);
}

/**
 * Obtiene los mensajes de límite alcanzado
 */
export function getLimitMessages() {
  const stats = getUsageStats();

  return {
    testLimit: {
      reached: stats.testsUsed >= MAX_FREE_TESTS,
      message: `Has alcanzado el límite de ${MAX_FREE_TESTS} test(s) gratuito(s) con IA. Para acceder a más análisis personalizados, contáctanos en ${CONTACT_EMAIL}`
    },
    chatLimit: {
      reached: stats.chatMessagesUsed >= MAX_FREE_CHAT_MESSAGES,
      remaining: Math.max(0, MAX_FREE_CHAT_MESSAGES - stats.chatMessagesUsed),
      message: `Has alcanzado el límite de ${MAX_FREE_CHAT_MESSAGES} mensajes gratuitos. Para continuar la conversación con IA, contáctanos en ${CONTACT_EMAIL}`
    }
  };
}

/**
 * Verifica si la IA está habilitada por variable de entorno
 */
export function isAIEnabled() {
  const envValue = import.meta.env.VITE_AI_ENABLED;
  // Por defecto está habilitada si no se especifica
  if (envValue === undefined || envValue === null) return true;
  // Convertir string a boolean
  return envValue === 'true' || envValue === true;
}

/**
 * Resetea los contadores (solo para desarrollo/testing)
 */
export function resetUsageLimits() {
  localStorage.removeItem(STORAGE_KEY);
}

// Exportar constantes para uso en componentes
export const LIMITS = {
  MAX_FREE_TESTS,
  MAX_FREE_CHAT_MESSAGES,
  CONTACT_EMAIL
};
