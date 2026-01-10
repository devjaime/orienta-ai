/**
 * Servicio de Apoderado - OrientaIA
 *
 * Gestión completa de funcionalidades para apoderados:
 * - Vincular estudiantes (hijos)
 * - Ver resultados de tests
 * - Seguimiento de sesiones
 * - Acceso a resúmenes IA del orientador
 */

import { supabase } from './supabase';

// ========================================
// GESTIÓN DE VÍNCULOS ESTUDIANTE
// ========================================

/**
 * Obtiene todos los estudiantes vinculados a un apoderado
 * @param {string} parentId - UUID del apoderado
 * @returns {Promise<Array>} Lista de estudiantes vinculados
 */
export async function getLinkedStudents(parentId) {
  const { data, error } = await supabase
    .from('parent_dashboard_summary')
    .select('*')
    .eq('parent_id', parentId)
    .eq('link_status', 'accepted');

  if (error) {
    console.error('Error fetching linked students:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene todos los vínculos pendientes de un apoderado
 * @param {string} parentId - UUID del apoderado
 * @returns {Promise<Array>} Lista de vínculos pendientes
 */
export async function getPendingLinks(parentId) {
  const { data, error } = await supabase
    .from('parent_student_links')
    .select(`
      *,
      student_profile:user_profiles!parent_student_links_student_id_fkey(*)
    `)
    .eq('parent_id', parentId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching pending links:', error);
    return [];
  }

  return data || [];
}

/**
 * Solicita vincular un estudiante por email
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentEmail - Email del estudiante
 * @param {string} relationship - Tipo de relación (padre/madre, tutor, etc)
 * @param {string} nickname - Apodo del estudiante (opcional)
 * @returns {Promise<string>} UUID del vínculo creado
 */
export async function requestStudentLink(
  parentId,
  studentEmail,
  relationship = 'padre/madre',
  nickname = null
) {
  const { data, error } = await supabase
    .rpc('request_parent_student_link', {
      p_parent_id: parentId,
      p_student_email: studentEmail,
      p_relationship: relationship,
      p_nickname: nickname
    });

  if (error) {
    console.error('Error requesting student link:', error);
    throw error;
  }

  return data;
}

/**
 * Cancela o elimina un vínculo
 * @param {string} linkId - UUID del vínculo
 * @returns {Promise<void>}
 */
export async function cancelLink(linkId) {
  const { error } = await supabase
    .from('parent_student_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('Error canceling link:', error);
    throw error;
  }
}

/**
 * Actualiza el apodo de un estudiante vinculado
 * @param {string} linkId - UUID del vínculo
 * @param {string} nickname - Nuevo apodo
 * @returns {Promise<void>}
 */
export async function updateStudentNickname(linkId, nickname) {
  const { error } = await supabase
    .from('parent_student_links')
    .update({ student_nickname: nickname })
    .eq('id', linkId);

  if (error) {
    console.error('Error updating nickname:', error);
    throw error;
  }
}

// ========================================
// ACCESO A RESULTADOS DE TESTS
// ========================================

/**
 * Obtiene todos los tests de un estudiante vinculado
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Array>} Lista de tests del estudiante
 */
export async function getStudentTests(parentId, studentId) {
  // Verificar que exista el vínculo aceptado
  const { data: link } = await supabase
    .from('parent_student_links')
    .select('can_view_tests')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .eq('status', 'accepted')
    .single();

  if (!link || !link.can_view_tests) {
    throw new Error('No tienes permiso para ver los tests de este estudiante');
  }

  // Obtener tests
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', studentId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching student tests:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene el último test de un estudiante
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Object|null>} Último test o null
 */
export async function getStudentLastTest(parentId, studentId) {
  const tests = await getStudentTests(parentId, studentId);
  return tests.length > 0 ? tests[0] : null;
}

// ========================================
// SEGUIMIENTO DE SESIONES
// ========================================

/**
 * Obtiene todas las sesiones de un estudiante vinculado
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Array>} Lista de sesiones del estudiante
 */
export async function getStudentSessions(parentId, studentId) {
  // Verificar que exista el vínculo aceptado
  const { data: link } = await supabase
    .from('parent_student_links')
    .select('can_view_sessions')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .eq('status', 'accepted')
    .single();

  if (!link || !link.can_view_sessions) {
    throw new Error('No tienes permiso para ver las sesiones de este estudiante');
  }

  // Obtener sesiones
  const { data, error } = await supabase
    .from('scheduled_sessions')
    .select(`
      *,
      orientador_profile:user_profiles!scheduled_sessions_orientador_id_fkey(nombre)
    `)
    .eq('user_id', studentId)
    .order('scheduled_date', { ascending: false });

  if (error) {
    console.error('Error fetching student sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene la próxima sesión programada de un estudiante
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Object|null>} Próxima sesión o null
 */
export async function getStudentNextSession(parentId, studentId) {
  const sessions = await getStudentSessions(parentId, studentId);

  const upcomingSessions = sessions.filter(s =>
    s.status === 'pending' || s.status === 'confirmed'
  ).filter(s =>
    new Date(s.scheduled_date) > new Date()
  );

  return upcomingSessions.length > 0 ? upcomingSessions[0] : null;
}

// ========================================
// RESÚMENES IA DEL ORIENTADOR
// ========================================

/**
 * Obtiene todos los resúmenes IA de sesiones de un estudiante
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Array>} Lista de resúmenes IA
 */
export async function getStudentAISummaries(parentId, studentId) {
  const { data, error } = await supabase
    .rpc('get_parent_student_ai_summaries', {
      p_parent_id: parentId,
      p_student_id: studentId
    });

  if (error) {
    console.error('Error fetching AI summaries:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene el último resumen IA de un estudiante
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Object|null>} Último resumen IA o null
 */
export async function getStudentLastAISummary(parentId, studentId) {
  const summaries = await getStudentAISummaries(parentId, studentId);
  return summaries.length > 0 ? summaries[0] : null;
}

// ========================================
// DASHBOARD DEL APODERADO
// ========================================

/**
 * Obtiene estadísticas completas de un estudiante para el dashboard
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Object>} Estadísticas completas del estudiante
 */
export async function getStudentDashboardStats(parentId, studentId) {
  const [tests, sessions, aiSummaries, link] = await Promise.all([
    getStudentTests(parentId, studentId),
    getStudentSessions(parentId, studentId),
    getStudentAISummaries(parentId, studentId),
    supabase
      .from('parent_student_links')
      .select(`
        *,
        student_profile:user_profiles!parent_student_links_student_id_fkey(*)
      `)
      .eq('parent_id', parentId)
      .eq('student_id', studentId)
      .eq('status', 'accepted')
      .single()
  ]);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const pendingSessions = sessions.filter(s => s.status === 'pending' || s.status === 'confirmed');
  const upcomingSessions = pendingSessions.filter(s => new Date(s.scheduled_date) > new Date());

  return {
    student: link.data?.student_profile || null,
    link: link.data || null,

    // Tests
    total_tests: tests.length,
    last_test: tests[0] || null,

    // Sesiones
    total_sessions: sessions.length,
    completed_sessions: completedSessions.length,
    pending_sessions: pendingSessions.length,
    next_session: upcomingSessions[0] || null,

    // Resúmenes IA
    total_ai_summaries: aiSummaries.length,
    last_ai_summary: aiSummaries[0] || null,

    // Timeline reciente
    recent_activity: [
      ...tests.map(t => ({ type: 'test', date: t.completed_at, data: t })),
      ...sessions.map(s => ({ type: 'session', date: s.scheduled_date, data: s }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
  };
}

/**
 * Obtiene resumen de todos los estudiantes vinculados a un apoderado
 * @param {string} parentId - UUID del apoderado
 * @returns {Promise<Array>} Lista de resúmenes de estudiantes
 */
export async function getAllStudentsSummary(parentId) {
  const students = await getLinkedStudents(parentId);

  const summaries = await Promise.all(
    students.map(async (student) => {
      try {
        const stats = await getStudentDashboardStats(parentId, student.student_id);
        return {
          student_id: student.student_id,
          student_name: student.student_name,
          student_nickname: student.student_nickname,
          ...stats
        };
      } catch (error) {
        console.error(`Error fetching stats for student ${student.student_id}:`, error);
        return {
          student_id: student.student_id,
          student_name: student.student_name,
          error: true
        };
      }
    })
  );

  return summaries;
}

// ========================================
// PROGRESO DEL ESTUDIANTE
// ========================================

/**
 * Obtiene el progreso general de un estudiante
 * @param {string} parentId - UUID del apoderado
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Object>} Objeto con métricas de progreso
 */
export async function getStudentProgress(parentId, studentId) {
  const stats = await getStudentDashboardStats(parentId, studentId);

  // Calcular nivel de progreso
  let progressLevel = 'inicial';
  let progressScore = 0;

  if (stats.total_tests > 0) progressScore += 25;
  if (stats.completed_sessions > 0) progressScore += 25;
  if (stats.completed_sessions >= 3) progressScore += 25;
  if (stats.last_ai_summary) progressScore += 25;

  if (progressScore >= 75) progressLevel = 'avanzado';
  else if (progressScore >= 50) progressLevel = 'intermedio';
  else if (progressScore >= 25) progressLevel = 'inicial';

  return {
    progress_score: progressScore,
    progress_level: progressLevel,
    has_test: stats.total_tests > 0,
    has_sessions: stats.completed_sessions > 0,
    has_orientador: stats.next_session?.orientador_profile ? true : false,
    last_activity: stats.recent_activity[0] || null
  };
}
