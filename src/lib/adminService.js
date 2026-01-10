/**
 * Servicio de Administración - OrientaIA
 *
 * Gestión completa de usuarios y roles por el administrador:
 * - Aprobar/rechazar usuarios
 * - Cambiar roles y estados
 * - Ver estadísticas de usuarios
 * - Control de acceso y seguridad
 */

import { supabase } from './supabase';

// ========================================
// GESTIÓN DE USUARIOS PENDIENTES
// ========================================

/**
 * Obtiene todos los usuarios pendientes de aprobación
 * @returns {Promise<Array>} Lista de usuarios pendientes
 */
export async function getPendingUsers() {
  const { data, error } = await supabase
    .rpc('get_pending_users');

  if (error) {
    console.error('Error fetching pending users:', error);
    return [];
  }

  return data || [];
}

/**
 * Aprueba un usuario y le asigna un rol
 * @param {string} userId - UUID del usuario a aprobar
 * @param {string} role - Rol a asignar (estudiante, apoderado, orientador, admin)
 * @param {string} adminId - UUID del administrador que aprueba
 * @param {string} notes - Notas opcionales
 * @returns {Promise<boolean>} True si se aprobó exitosamente
 */
export async function approveUser(userId, role, adminId, notes = null) {
  const { data, error } = await supabase
    .rpc('approve_user_with_role', {
      p_user_id: userId,
      p_role: role,
      p_admin_id: adminId,
      p_notes: notes
    });

  if (error) {
    console.error('Error approving user:', error);
    throw error;
  }

  return data;
}

/**
 * Rechaza la solicitud de un usuario
 * @param {string} userId - UUID del usuario a rechazar
 * @param {string} adminId - UUID del administrador que rechaza
 * @param {string} reason - Razón del rechazo
 * @returns {Promise<boolean>} True si se rechazó exitosamente
 */
export async function rejectUser(userId, adminId, reason) {
  const { data, error } = await supabase
    .rpc('reject_user_request', {
      p_user_id: userId,
      p_admin_id: adminId,
      p_reason: reason
    });

  if (error) {
    console.error('Error rejecting user:', error);
    throw error;
  }

  return data;
}

// ========================================
// GESTIÓN DE ESTADOS DE USUARIOS
// ========================================

/**
 * Cambia el estado de un usuario
 * @param {string} userId - UUID del usuario
 * @param {string} adminId - UUID del administrador
 * @param {string} newStatus - Nuevo estado (pending, active, inactive, suspended, rejected)
 * @param {string} reason - Razón del cambio (opcional)
 * @returns {Promise<boolean>} True si se cambió exitosamente
 */
export async function changeUserStatus(userId, adminId, newStatus, reason = null) {
  const { data, error } = await supabase
    .rpc('change_user_status', {
      p_user_id: userId,
      p_admin_id: adminId,
      p_new_status: newStatus,
      p_reason: reason
    });

  if (error) {
    console.error('Error changing user status:', error);
    throw error;
  }

  return data;
}

/**
 * Activa un usuario (cambia estado a active)
 * @param {string} userId - UUID del usuario
 * @param {string} adminId - UUID del administrador
 * @returns {Promise<boolean>}
 */
export async function activateUser(userId, adminId) {
  return changeUserStatus(userId, adminId, 'active', 'Usuario activado por administrador');
}

/**
 * Desactiva un usuario (cambia estado a inactive)
 * @param {string} userId - UUID del usuario
 * @param {string} adminId - UUID del administrador
 * @param {string} reason - Razón de la desactivación
 * @returns {Promise<boolean>}
 */
export async function deactivateUser(userId, adminId, reason) {
  return changeUserStatus(userId, adminId, 'inactive', reason);
}

/**
 * Suspende un usuario (cambia estado a suspended)
 * @param {string} userId - UUID del usuario
 * @param {string} adminId - UUID del administrador
 * @param {string} reason - Razón de la suspensión
 * @returns {Promise<boolean>}
 */
export async function suspendUser(userId, adminId, reason) {
  return changeUserStatus(userId, adminId, 'suspended', reason);
}

// ========================================
// GESTIÓN DE ROLES
// ========================================

/**
 * Cambia el rol de un usuario
 * @param {string} userId - UUID del usuario
 * @param {string} adminId - UUID del administrador
 * @param {string} newRole - Nuevo rol (estudiante, apoderado, orientador, admin)
 * @param {string} reason - Razón del cambio (opcional)
 * @returns {Promise<boolean>} True si se cambió exitosamente
 */
export async function changeUserRole(userId, adminId, newRole, reason = null) {
  const { data, error } = await supabase
    .rpc('change_user_role', {
      p_user_id: userId,
      p_admin_id: adminId,
      p_new_role: newRole,
      p_reason: reason
    });

  if (error) {
    console.error('Error changing user role:', error);
    throw error;
  }

  return data;
}

// ========================================
// CONSULTA DE USUARIOS
// ========================================

/**
 * Obtiene todos los usuarios con información completa para gestión
 * @returns {Promise<Array>} Lista de usuarios
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('admin_users_management')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all users:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene usuarios filtrados por estado
 * @param {string} status - Estado a filtrar (pending, active, inactive, suspended, rejected)
 * @returns {Promise<Array>} Lista de usuarios con ese estado
 */
export async function getUsersByStatus(status) {
  const { data, error } = await supabase
    .from('admin_users_management')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users by status:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene usuarios filtrados por rol
 * @param {string} role - Rol a filtrar (estudiante, apoderado, orientador, admin)
 * @returns {Promise<Array>} Lista de usuarios con ese rol
 */
export async function getUsersByRole(role) {
  const { data, error } = await supabase
    .from('admin_users_management')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }

  return data || [];
}

/**
 * Busca usuarios por nombre o email
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>} Lista de usuarios que coinciden
 */
export async function searchUsers(searchTerm) {
  const { data, error } = await supabase
    .from('admin_users_management')
    .select('*')
    .or(`nombre.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene información detallada de un usuario específico
 * @param {string} userId - UUID del usuario
 * @returns {Promise<Object|null>} Información del usuario
 */
export async function getUserDetails(userId) {
  const { data, error } = await supabase
    .from('admin_users_management')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user details:', error);
    return null;
  }

  return data;
}

// ========================================
// ESTADÍSTICAS DE USUARIOS
// ========================================

/**
 * Obtiene estadísticas generales de usuarios
 * @returns {Promise<Object>} Objeto con estadísticas
 */
export async function getUserStats() {
  const users = await getAllUsers();

  const stats = {
    total: users.length,
    by_role: {
      estudiante: users.filter(u => u.role === 'estudiante').length,
      apoderado: users.filter(u => u.role === 'apoderado').length,
      orientador: users.filter(u => u.role === 'orientador').length,
      admin: users.filter(u => u.role === 'admin').length,
      unassigned: users.filter(u => !u.role).length
    },
    by_status: {
      active: users.filter(u => u.status === 'active').length,
      pending: users.filter(u => u.status === 'pending').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      rejected: users.filter(u => u.status === 'rejected').length
    },
    pending_approval: users.filter(u => u.status === 'pending' && u.requested_role).length,
    recent_registrations: users.filter(u => {
      const daysSinceCreation = (new Date() - new Date(u.created_at)) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 7;
    }).length
  };

  return stats;
}

// ========================================
// ACTUALIZACIÓN DE PERFIL DE USUARIO
// ========================================

/**
 * Actualiza las notas del administrador sobre un usuario
 * @param {string} userId - UUID del usuario
 * @param {string} notes - Notas del administrador
 * @returns {Promise<void>}
 */
export async function updateAdminNotes(userId, notes) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ admin_notes: notes })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating admin notes:', error);
    throw error;
  }
}

/**
 * Actualiza información básica de un usuario
 * @param {string} userId - UUID del usuario
 * @param {Object} updates - Objeto con campos a actualizar
 * @returns {Promise<void>}
 */
export async function updateUserInfo(userId, updates) {
  // Campos permitidos para actualizar
  const allowedFields = ['nombre', 'edad', 'genero', 'telefono', 'admin_notes'];
  const filteredUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  const { error } = await supabase
    .from('user_profiles')
    .update(filteredUpdates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user info:', error);
    throw error;
  }
}

// ========================================
// VERIFICACIÓN DE PERMISOS
// ========================================

/**
 * Verifica si un usuario es administrador activo
 * @param {string} userId - UUID del usuario
 * @returns {Promise<boolean>} True si es admin activo
 */
export async function isActiveAdmin(userId) {
  const { data } = await supabase
    .from('user_profiles')
    .select('role, status')
    .eq('user_id', userId)
    .single();

  return data?.role === 'admin' && data?.status === 'active';
}

/**
 * Verifica si un usuario tiene un estado específico
 * @param {string} userId - UUID del usuario
 * @param {string} status - Estado a verificar
 * @returns {Promise<boolean>} True si tiene ese estado
 */
export async function hasStatus(userId, status) {
  const { data } = await supabase
    .from('user_profiles')
    .select('status')
    .eq('user_id', userId)
    .single();

  return data?.status === status;
}

/**
 * Verifica si un usuario tiene un rol específico
 * @param {string} userId - UUID del usuario
 * @param {string} role - Rol a verificar
 * @returns {Promise<boolean>} True si tiene ese rol
 */
export async function hasRole(userId, role) {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return data?.role === role;
}

/**
 * Verifica si un usuario puede acceder al sistema
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{canAccess: boolean, reason: string}>}
 */
export async function canAccessSystem(userId) {
  const { data } = await supabase
    .from('user_profiles')
    .select('status, role, rejection_reason')
    .eq('user_id', userId)
    .single();

  if (!data) {
    return { canAccess: false, reason: 'Usuario no encontrado' };
  }

  if (data.status === 'suspended') {
    return { canAccess: false, reason: 'Tu cuenta ha sido suspendida' };
  }

  if (data.status === 'inactive') {
    return { canAccess: false, reason: 'Tu cuenta está inactiva' };
  }

  if (data.status === 'rejected') {
    return {
      canAccess: false,
      reason: `Tu solicitud fue rechazada: ${data.rejection_reason || 'Sin razón especificada'}`
    };
  }

  if (data.status === 'pending' && !data.role) {
    return {
      canAccess: false,
      reason: 'Tu solicitud está pendiente de aprobación por un administrador'
    };
  }

  if (data.status === 'active' && data.role) {
    return { canAccess: true, reason: 'Acceso permitido' };
  }

  return { canAccess: false, reason: 'Estado de cuenta inválido' };
}
