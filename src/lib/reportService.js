/**
 * Servicio de Informes Pagados - Vocari
 *
 * Gestión de informes vocacionales pagados (B2C):
 * - Consultar planes disponibles
 * - Crear orden de pago con PayPal
 * - Consultar informes del usuario
 * - Aprobar/rechazar informes (admin/orientador)
 */

// ========================================
// PAYMENT LINKS - PayPal NCP
// ========================================
const PAYMENT_LINKS = {
  esencial: 'https://www.paypal.com/ncp/payment/DCEGNNL4FVNHA',
  premium: 'https://www.paypal.com/ncp/payment/4CB6YZZS7G5VQ',
};

// ========================================
// PLANES
// ========================================

/**
 * Obtiene los planes de informe activos
 * @returns {Promise<Array>} Lista de planes activos
 */
export async function getReportPlans() {
  // En producción, esto vendría de la DB. Por ahora retornamos datos locales.
  return [
    {
      id: 'esencial',
      name: 'esencial',
      display_name: 'Plan Esencial',
      price_clp: 10990,
      price_usd: 12,
      features: [
        'Informe PDF completo',
        'Análisis RIASEC detallado',
        'Carreras recomendadas con datos MINEDUC',
        'Revisado por orientadores calificados'
      ]
    },
    {
      id: 'premium',
      name: 'premium',
      display_name: 'Plan Premium',
      price_clp: 14990,
      price_usd: 20,
      features: [
        'Informe PDF completo',
        'Análisis RIASEC detallado',
        'Carreras recomendadas con datos MINEDUC',
        'Revisado por orientadores calificados',
        'Explicación visual personalizada',
        'Resumen ejecutivo animado'
      ]
    }
  ];
}

// ========================================
// CHECKOUT / COMPRA
// ========================================

/**
 * Crea una orden de pago con PayPal
 * @param {string} planId - ID del plan seleccionado (esencial | premium)
 * @returns {Promise<string>} URL de pago de PayPal
 */
export async function createCheckoutSession(planId) {
  // Mapear planId al enlace de PayPal
  const paymentUrl = PAYMENT_LINKS[planId] || PAYMENT_LINKS.esencial;
  
  // En el futuro, aquí podríamos crear una sesión en nuestro backend
  // y obtener un token de PayPal para un flujo más controlado.
  // Por ahora, usamos enlaces directos NCP.
  return paymentUrl;
}

// ========================================
// INFORMES DEL USUARIO
// ========================================

/**
 * Obtiene los informes del usuario actual
 * @returns {Promise<Array>} Lista de informes del usuario
 */
export async function getMyReports() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('paid_reports')
    .select(`
      *,
      plan:report_plans(name, display_name, price_clp, features)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene un informe por su ID
 * @param {string} reportId - UUID del informe
 * @returns {Promise<Object|null>} Informe con datos del plan
 */
export async function getReportById(reportId) {
  const { data, error } = await supabase
    .from('paid_reports')
    .select(`
      *,
      plan:report_plans(name, display_name, price_clp, features)
    `)
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error fetching report:', error);
    return null;
  }

  return data;
}

// ========================================
// ADMIN / ORIENTADOR - REVISIÓN
// ========================================

/**
 * Obtiene todos los informes pendientes de revisión
 * @returns {Promise<Array>} Lista de informes en estado 'review'
 */
export async function getAllPendingReports() {
  const { data, error } = await supabase
    .from('paid_reports_admin')
    .select('*')
    .eq('status', 'review');

  if (error) {
    console.error('Error fetching pending reports:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene todos los informes con filtro de status opcional
 * @param {string} [statusFilter] - Filtro de status opcional
 * @returns {Promise<Array>} Lista de informes
 */
export async function getAllReports(statusFilter) {
  let query = supabase
    .from('paid_reports_admin')
    .select('*');

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all reports:', error);
    return [];
  }

  return data || [];
}

/**
 * Aprueba un informe (admin/orientador)
 * @param {string} reportId - UUID del informe
 * @param {string} notes - Notas del revisor
 * @returns {Promise<Object|null>} Informe actualizado
 */
export async function approveReport(reportId, notes = '') {
  const user = await getCurrentUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('paid_reports')
    .update({
      status: 'approved',
      reviewer_id: user.id,
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error approving report:', error);
    throw error;
  }

  return data;
}

/**
 * Rechaza un informe con notas (admin/orientador)
 * @param {string} reportId - UUID del informe
 * @param {string} notes - Razón del rechazo
 * @returns {Promise<Object|null>} Informe actualizado
 */
export async function rejectReport(reportId, notes) {
  const user = await getCurrentUser();
  if (!user) throw new Error('No autenticado');

  if (!notes) {
    throw new Error('Se requieren notas para rechazar un informe');
  }

  const { data, error } = await supabase
    .from('paid_reports')
    .update({
      status: 'rejected',
      reviewer_id: user.id,
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting report:', error);
    throw error;
  }

  return data;
}

// ========================================
// HELPERS
// ========================================

/**
 * Mapa de labels para los status de informes
 */
export const STATUS_LABELS = {
  pending_payment: 'Procesando pago',
  paid: 'Pago confirmado',
  generating: 'Generando informe',
  review: 'En revisión',
  approved: 'Aprobado',
  delivered: 'Entregado',
  rejected: 'Rechazado'
};

/**
 * Mapa de colores para los status de informes
 */
export const STATUS_COLORS = {
  pending_payment: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-blue-500/20 text-blue-400',
  generating: 'bg-blue-500/20 text-blue-400',
  review: 'bg-purple-500/20 text-purple-400',
  approved: 'bg-green-500/20 text-green-400',
  delivered: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400'
};

/**
 * Formatea precio CLP
 * @param {number} price - Precio en CLP
 * @returns {string} Precio formateado
 */
export function formatPriceCLP(price) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
}
