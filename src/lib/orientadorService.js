/**
 * Servicio de Orientador - OrientaIA
 *
 * Gestión completa de funcionalidades para orientadores:
 * - Disponibilidad y calendario
 * - Asignación automática de alumnos
 * - Apuntes de sesiones con IA
 * - Estadísticas y métricas de carga
 */

import { supabase } from './supabase';

// ========================================
// GESTIÓN DE DISPONIBILIDAD
// ========================================

/**
 * Obtiene la disponibilidad de un orientador
 * @param {string} orientadorId - UUID del orientador
 * @returns {Promise<Array>} Lista de horarios disponibles
 */
export async function getOrientadorAvailability(orientadorId) {
  const { data, error } = await supabase
    .from('orientador_availability')
    .select('*')
    .eq('orientador_id', orientadorId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching availability:', error);
    return [];
  }

  return data || [];
}

/**
 * Guarda/actualiza disponibilidad de un orientador
 * @param {string} orientadorId - UUID del orientador
 * @param {Array} availabilitySlots - Array de slots de disponibilidad
 * @returns {Promise<Array>} Slots guardados
 */
export async function saveOrientadorAvailability(orientadorId, availabilitySlots) {
  // Primero eliminar disponibilidad existente
  const { error: deleteError } = await supabase
    .from('orientador_availability')
    .delete()
    .eq('orientador_id', orientadorId);

  if (deleteError) {
    console.error('Error deleting old availability:', deleteError);
    throw deleteError;
  }

  // Insertar nueva disponibilidad
  const { data, error } = await supabase
    .from('orientador_availability')
    .insert(
      availabilitySlots.map(slot => ({
        orientador_id: orientadorId,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_duration_minutes: slot.slot_duration_minutes || 30,
        is_active: true
      }))
    )
    .select();

  if (error) {
    console.error('Error saving availability:', error);
    throw error;
  }

  return data;
}

/**
 * Obtiene slots disponibles en un rango de fechas
 * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha fin (YYYY-MM-DD)
 * @param {string|null} orientadorId - UUID del orientador (opcional, null = todos)
 * @returns {Promise<Array>} Lista de slots disponibles
 */
export async function getAvailableTimeSlots(startDate, endDate, orientadorId = null) {
  const { data, error } = await supabase
    .rpc('get_available_time_slots', {
      start_date: startDate,
      end_date: endDate,
      orientador_filter: orientadorId
    });

  if (error) {
    console.error('Error fetching time slots:', error);
    return [];
  }

  return data || [];
}

// ========================================
// ASIGNACIÓN DE ORIENTADORES
// ========================================

/**
 * Asigna automáticamente un orientador a un estudiante
 * Busca el orientador disponible con menor carga de trabajo
 * @param {string} studentId - UUID del estudiante
 * @param {string} preferredDate - Fecha/hora preferida (ISO string)
 * @returns {Promise<string>} UUID del orientador asignado
 */
export async function autoAssignOrientador(studentId, preferredDate) {
  // 1. Buscar orientador con menor carga disponible
  const { data: orientadorId, error: rpcError } = await supabase
    .rpc('get_available_orientador_with_least_workload', {
      preferred_date: preferredDate,
      duration_mins: 30
    });

  if (rpcError) {
    console.error('Error finding available orientador:', rpcError);
    throw new Error('Error al buscar orientador disponible');
  }

  if (!orientadorId) {
    throw new Error('No hay orientadores disponibles para la fecha seleccionada');
  }

  // 2. Verificar si ya existe una asignación activa
  const { data: existingAssignment } = await supabase
    .from('student_orientador_assignments')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .maybeSingle();

  // 3. Si no existe asignación, crearla
  if (!existingAssignment) {
    const { error: assignError } = await supabase
      .from('student_orientador_assignments')
      .insert({
        student_id: studentId,
        orientador_id: orientadorId,
        assignment_type: 'auto',
        status: 'active'
      });

    if (assignError) {
      console.error('Error creating assignment:', assignError);
      throw assignError;
    }
  }

  return orientadorId;
}

/**
 * Obtiene el orientador asignado a un estudiante
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Object|null>} Datos de asignación con info del orientador
 */
export async function getStudentOrientador(studentId) {
  const { data, error } = await supabase
    .from('student_orientador_assignments')
    .select(`
      *,
      orientador_profile:user_profiles!student_orientador_assignments_orientador_id_fkey(*)
    `)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching student orientador:', error);
    return null;
  }

  return data;
}

/**
 * Obtiene estudiantes asignados a un orientador
 * @param {string} orientadorId - UUID del orientador
 * @returns {Promise<Array>} Lista de estudiantes asignados
 */
export async function getOrientadorStudents(orientadorId) {
  const { data, error } = await supabase
    .from('student_orientador_assignments')
    .select(`
      *,
      student_profile:user_profiles!student_orientador_assignments_student_id_fkey(*)
    `)
    .eq('orientador_id', orientadorId)
    .eq('status', 'active')
    .order('assigned_at', { ascending: false });

  if (error) {
    console.error('Error fetching orientador students:', error);
    return [];
  }

  return data || [];
}

// ========================================
// APUNTES DE SESIONES CON IA
// ========================================

/**
 * Guarda apuntes de una sesión
 * @param {string} sessionId - UUID de la sesión
 * @param {string} orientadorId - UUID del orientador
 * @param {string} rawNotes - Notas en texto plano
 * @param {Array} tags - Tags/etiquetas
 * @returns {Promise<Object>} Apuntes guardados
 */
export async function saveSessionNotes(sessionId, orientadorId, rawNotes, tags = []) {
  const { data, error } = await supabase
    .from('session_notes')
    .upsert({
      session_id: sessionId,
      orientador_id: orientadorId,
      raw_notes: rawNotes,
      tags: tags
    }, {
      onConflict: 'session_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving session notes:', error);
    throw error;
  }

  return data;
}

/**
 * Genera resumen IA de apuntes de sesión
 * @param {string} sessionId - UUID de la sesión
 * @param {string} rawNotes - Notas en texto plano
 * @returns {Promise<Object>} Apuntes con resumen IA generado
 */
export async function generateNotesAISummary(sessionId, rawNotes) {
  try {
    // Llamar a Netlify Function para generar resumen con Claude
    const response = await fetch('/.netlify/functions/generate-session-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        raw_notes: rawNotes
      })
    });

    if (!response.ok) {
      throw new Error('Error generando resumen IA');
    }

    const { summary, analysis } = await response.json();

    // Actualizar en base de datos
    const { data, error } = await supabase
      .from('session_notes')
      .update({
        ai_summary: summary,
        ai_analysis: analysis,
        ai_generated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return data;

  } catch (err) {
    console.error('Error generating AI summary:', err);
    throw err;
  }
}

/**
 * Obtiene apuntes de una sesión
 * @param {string} sessionId - UUID de la sesión
 * @returns {Promise<Object|null>} Apuntes de la sesión
 */
export async function getSessionNotes(sessionId) {
  const { data, error } = await supabase
    .from('session_notes')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching session notes:', error);
    return null;
  }

  return data;
}

// ========================================
// ESTADÍSTICAS DE ORIENTADOR
// ========================================

/**
 * Obtiene estadísticas de carga de trabajo
 * @param {string|null} orientadorId - UUID del orientador (null = todos)
 * @returns {Promise<Object|Array>} Stats de un orientador o lista de todos
 */
export async function getOrientadorWorkloadStats(orientadorId = null) {
  let query = supabase
    .from('orientador_workload_stats')
    .select('*');

  if (orientadorId) {
    query = query.eq('orientador_id', orientadorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workload stats:', error);
    return orientadorId ? null : [];
  }

  return orientadorId ? (data && data[0]) : (data || []);
}

/**
 * Refresca las estadísticas de carga (llamar periódicamente)
 * @returns {Promise<void>}
 */
export async function refreshWorkloadStats() {
  const { error } = await supabase
    .rpc('refresh_orientador_workload_stats');

  if (error) {
    console.error('Error refreshing workload stats:', error);
    throw error;
  }
}

// ========================================
// PROGRESO DE ESTUDIANTE
// ========================================

/**
 * Obtiene timeline completo de actividad de un estudiante
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Array>} Timeline ordenado por fecha descendente
 */
export async function getStudentTimeline(studentId) {
  // Combinar datos de múltiples fuentes
  const [testsRes, sessionsRes, auditRes] = await Promise.all([
    // Tests
    supabase
      .from('test_results')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false }),

    // Sesiones
    supabase
      .from('scheduled_sessions')
      .select('*, orientador_profile:user_profiles!scheduled_sessions_orientador_id_fkey(nombre)')
      .eq('user_id', studentId)
      .order('scheduled_date', { ascending: false }),

    // Audit log
    supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50)
  ]);

  const timeline = [];

  // Agregar tests
  (testsRes.data || []).forEach(test => {
    timeline.push({
      type: 'test',
      date: test.completed_at || test.created_at,
      data: test,
      icon: 'ClipboardList',
      color: 'green'
    });
  });

  // Agregar sesiones
  (sessionsRes.data || []).forEach(session => {
    timeline.push({
      type: 'session',
      date: session.scheduled_date,
      data: session,
      icon: 'Calendar',
      color: session.status === 'completed' ? 'blue' : 'yellow'
    });
  });

  // Agregar eventos importantes del audit log
  (auditRes.data || []).forEach(log => {
    if (['test_completed', 'session_scheduled', 'profile_updated'].includes(log.action_type)) {
      timeline.push({
        type: 'activity',
        date: log.created_at,
        data: log,
        icon: 'Activity',
        color: 'purple'
      });
    }
  });

  // Ordenar por fecha descendente
  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  return timeline;
}

/**
 * Obtiene estadísticas avanzadas de un estudiante
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Object>} Estadísticas completas
 */
export async function getStudentAdvancedStats(studentId) {
  const [profile, tests, sessions, auditLog] = await Promise.all([
    // Perfil
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', studentId)
      .single(),

    // Tests
    supabase
      .from('test_results')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false }),

    // Sesiones
    supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('user_id', studentId)
      .order('scheduled_date', { ascending: false }),

    // Audit log reciente
    supabase
      .from('audit_log')
      .select('created_at')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
  ]);

  const testsData = tests.data || [];
  const sessionsData = sessions.data || [];

  // Calcular días desde última actividad
  let daysSinceLastActivity = null;
  if (auditLog.data && auditLog.data[0]) {
    const lastActivity = new Date(auditLog.data[0].created_at);
    const now = new Date();
    daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  }

  return {
    profile: profile.data,
    total_tests: testsData.length,
    last_test: testsData[0] || null,
    total_sessions: sessionsData.length,
    completed_sessions: sessionsData.filter(s => s.status === 'completed').length,
    pending_sessions: sessionsData.filter(s => s.status === 'pending').length,
    last_session: sessionsData[0] || null,
    days_since_last_activity: daysSinceLastActivity
  };
}

/**
 * Obtiene estudiantes con alertas (inactividad >30 días, sin sesiones, etc.)
 * @param {string} orientadorId - UUID del orientador
 * @returns {Promise<Array>} Lista de estudiantes con alertas
 */
export async function getStudentsWithAlerts(orientadorId) {
  const students = await getOrientadorStudents(orientadorId);
  const studentsWithAlerts = [];

  for (const student of students) {
    const stats = await getStudentAdvancedStats(student.student_id);

    const alerts = [];

    // Alerta: Inactividad >30 días
    if (stats.days_since_last_activity !== null && stats.days_since_last_activity > 30) {
      alerts.push({
        type: 'inactivity',
        severity: 'warning',
        message: `Sin actividad en ${stats.days_since_last_activity} días`
      });
    }

    // Alerta: Sin sesiones
    if (stats.total_sessions === 0) {
      alerts.push({
        type: 'no_sessions',
        severity: 'info',
        message: 'Aún no ha tenido sesiones'
      });
    }

    // Alerta: Tests sin seguimiento
    if (stats.total_tests > 0 && stats.completed_sessions === 0) {
      alerts.push({
        type: 'test_without_followup',
        severity: 'warning',
        message: `Completó ${stats.total_tests} test(s) sin sesión de seguimiento`
      });
    }

    if (alerts.length > 0) {
      studentsWithAlerts.push({
        ...student,
        stats,
        alerts
      });
    }
  }

  return studentsWithAlerts;
}
