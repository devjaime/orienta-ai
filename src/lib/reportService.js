/**
 * Servicio de Informes Pagados - Vocari
 *
 * Gestión de informes vocacionales pagados (B2C):
 * - Consultar planes disponibles
 * - Crear orden de pago con Flow.cl
 * - Consultar informes del usuario
 * - Aprobar/rechazar informes (admin/orientador)
 */

import { supabase, getCurrentUser } from './supabase';

// ========================================
// PLANES
// ========================================

/**
 * Obtiene los planes de informe activos
 * @returns {Promise<Array>} Lista de planes activos
 */
export async function getReportPlans() {
  const { data, error } = await supabase
    .from('report_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_clp', { ascending: true });

  if (error) {
    console.error('Error fetching report plans:', error);
    return [];
  }

  return data || [];
}

// ========================================
// CHECKOUT / COMPRA
// ========================================

/**
 * Crea una orden de pago en Flow.cl vía Netlify Function
 * @param {string} planId - UUID del plan seleccionado
 * @returns {Promise<string>} URL de checkout de Flow
 */
export async function createCheckoutSession(planId) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const response = await fetch('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId,
      userId: user.id,
      userEmail: user.email
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al crear sesión de pago');
  }

  const data = await response.json();
  return data.url;
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
