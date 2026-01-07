/**
 * Sistema de Auditoría y Seguimiento para Apoderados
 *
 * Permite a los padres hacer seguimiento de las actividades
 * de sus hijos en la plataforma
 */

import { supabase } from './supabase';

// Tipos de acciones que se pueden registrar
export const AuditActionTypes = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  TEST_STARTED: 'test_started',
  TEST_COMPLETED: 'test_completed',
  PROFILE_UPDATED: 'profile_updated',
  CAREER_VIEWED: 'career_viewed',
  CAREER_SAVED: 'career_saved',
  SESSION_COUNSELOR_SCHEDULED: 'session_scheduled',
  SESSION_COUNSELOR_COMPLETED: 'session_completed',
  DASHBOARD_VIEWED: 'dashboard_viewed',
  COMPARISON_MADE: 'comparison_made'
};

/**
 * Registra una acción en el audit log
 */
export async function logAction({
  actionType,
  description,
  entityType = null,
  entityId = null,
  metadata = {}
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('No hay usuario autenticado para registrar acción');
      return null;
    }

    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        action_type: actionType,
        action_description: description,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
        ip_address: null, // Se puede obtener del navegador si es necesario
        user_agent: navigator.userAgent
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error registrando acción en audit log:', error);
    return null;
  }
}

/**
 * Obtiene el historial de actividad de un usuario
 */
export async function getUserActivityLog(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    actionType = null,
    startDate = null,
    endDate = null
  } = options;

  try {
    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo historial de actividad:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de actividad de un usuario
 */
export async function getUserActivityStats(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_log')
      .select('action_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Agrupar por tipo de acción
    const actionCounts = {};
    data.forEach(log => {
      actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
    });

    // Calcular actividad por día
    const activityByDay = {};
    data.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('es-CL');
      activityByDay[date] = (activityByDay[date] || 0) + 1;
    });

    return {
      totalActions: data.length,
      actionCounts,
      activityByDay,
      periodDays: days
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de actividad:', error);
    return null;
  }
}

/**
 * Vincula un apoderado con un estudiante
 */
export async function linkParentToStudent(studentEmail, relationshipType = 'apoderado') {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Debes estar autenticado para vincular un estudiante');
    }

    // Buscar al estudiante por email
    const { data: studentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_email', studentEmail)
      .single();

    if (profileError || !studentProfile) {
      throw new Error('No se encontró un estudiante con ese email');
    }

    // Crear la relación
    const { data, error } = await supabase
      .from('parent_student_relationships')
      .insert({
        parent_user_id: user.id,
        student_user_id: studentProfile.user_id,
        relationship_type: relationshipType,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Duplicate key
        throw new Error('Ya existe una solicitud de vinculación con este estudiante');
      }
      throw error;
    }

    // Enviar notificación al estudiante
    await supabase
      .from('parent_notifications')
      .insert({
        parent_user_id: user.id,
        student_user_id: studentProfile.user_id,
        notification_type: 'relationship_request',
        title: 'Solicitud de Vinculación',
        message: `Un apoderado ha solicitado vincularse contigo como ${relationshipType}`,
        priority: 'high'
      });

    return data;
  } catch (error) {
    console.error('Error vinculando apoderado:', error);
    throw error;
  }
}

/**
 * Obtiene las relaciones de un apoderado
 */
export async function getParentRelationships() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from('parent_student_relationships')
      .select(`
        *,
        student:student_user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('parent_user_id', user.id);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo relaciones:', error);
    return [];
  }
}

/**
 * Acepta una solicitud de vinculación (desde el lado del estudiante)
 */
export async function acceptParentRelationship(relationshipId) {
  try {
    const { data, error } = await supabase
      .from('parent_student_relationships')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', relationshipId)
      .select()
      .single();

    if (error) throw error;

    // Registrar en audit log
    await logAction({
      actionType: 'parent_relationship_accepted',
      description: 'Apoderado vinculado exitosamente',
      entityType: 'relationship',
      entityId: relationshipId
    });

    return data;
  } catch (error) {
    console.error('Error aceptando vinculación:', error);
    throw error;
  }
}

/**
 * Obtiene notificaciones para apoderados
 */
export async function getParentNotifications(includeRead = false) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
      .from('parent_notifications')
      .select('*')
      .eq('parent_user_id', user.id)
      .order('created_at', { ascending: false });

    if (!includeRead) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('parent_notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return false;
  }
}

/**
 * Obtiene un resumen de actividad de múltiples estudiantes (para apoderados)
 */
export async function getStudentsSummary() {
  try {
    const relationships = await getParentRelationships();
    const acceptedRelationships = relationships.filter(r => r.status === 'accepted');

    const summaries = await Promise.all(
      acceptedRelationships.map(async (rel) => {
        const stats = await getUserActivityStats(rel.student_user_id, 30);

        // Obtener último test
        const { data: lastTest } = await supabase
          .from('test_results')
          .select('*')
          .eq('user_id', rel.student_user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          relationship: rel,
          stats,
          lastTest,
          studentInfo: rel.student
        };
      })
    );

    return summaries;
  } catch (error) {
    console.error('Error obteniendo resumen de estudiantes:', error);
    return [];
  }
}
