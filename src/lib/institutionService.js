/**
 * Servicio de Instituciones - Vocari
 * Gestiona operaciones multi-colegio para el modelo B2B
 */

import { supabase, getCurrentUser, getUserProfile } from './supabase'

// ============================================
// VERIFICACIÓN DE ROLES
// ============================================

/**
 * Verifica si el usuario actual es super_admin
 */
export const isSuperAdmin = async () => {
  const profile = await getUserProfile()
  return profile?.role === 'super_admin' && profile?.status === 'active'
}

/**
 * Verifica si el usuario actual es admin de colegio o super_admin
 */
export const isInstitutionAdmin = async () => {
  const profile = await getUserProfile()
  const adminRoles = ['admin_colegio', 'super_admin', 'admin']
  return adminRoles.includes(profile?.role) && profile?.status === 'active'
}

/**
 * Obtiene el institution_id del usuario actual
 */
export const getCurrentInstitutionId = async () => {
  const profile = await getUserProfile()
  return profile?.institution_id || null
}

// ============================================
// GESTIÓN DE INSTITUCIONES
// ============================================

/**
 * Obtiene todas las instituciones (solo super_admin)
 */
export const getAllInstitutions = async () => {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching institutions:', error)
    throw error
  }

  return data || []
}

/**
 * Obtiene una institución por ID
 */
export const getInstitutionById = async (institutionId) => {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('id', institutionId)
    .single()

  if (error) {
    console.error('Error fetching institution:', error)
    throw error
  }

  return data
}

/**
 * Obtiene la institución del usuario actual
 */
export const getCurrentInstitution = async () => {
  const institutionId = await getCurrentInstitutionId()
  if (!institutionId) return null
  return getInstitutionById(institutionId)
}

/**
 * Crea una nueva institución (solo super_admin)
 */
export const createInstitution = async (institutionData) => {
  const { data, error } = await supabase.rpc('create_institution', {
    p_name: institutionData.name,
    p_code: institutionData.code,
    p_type: institutionData.type || 'particular',
    p_comuna: institutionData.comuna || null,
    p_region: institutionData.region || null,
    p_contact_name: institutionData.contact_name || null,
    p_contact_email: institutionData.contact_email || null,
    p_contact_phone: institutionData.contact_phone || null,
    p_max_students: institutionData.max_students || 100,
    p_pilot_start_date: institutionData.pilot_start_date || new Date().toISOString().split('T')[0],
    p_pilot_end_date: institutionData.pilot_end_date || null,
    p_notes: institutionData.notes || null
  })

  if (error) {
    console.error('Error creating institution:', error)
    throw error
  }

  return data
}

/**
 * Actualiza una institución
 */
export const updateInstitution = async (institutionId, updates) => {
  const { data, error } = await supabase
    .from('institutions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', institutionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating institution:', error)
    throw error
  }

  return data
}

/**
 * Cambia el estado de una institución
 */
export const updateInstitutionStatus = async (institutionId, status) => {
  return updateInstitution(institutionId, { status })
}

// ============================================
// GESTIÓN DE ESTUDIANTES
// ============================================

/**
 * Invita un estudiante a una institución
 * Retorna el código de activación
 */
export const inviteStudent = async (institutionId, studentData) => {
  const { data, error } = await supabase.rpc('invite_student', {
    p_institution_id: institutionId,
    p_email: studentData.email,
    p_nombre: studentData.nombre,
    p_curso: studentData.curso,
    p_student_code: studentData.student_code || null
  })

  if (error) {
    console.error('Error inviting student:', error)
    throw error
  }

  // data es un array con un solo elemento
  return data?.[0] || data
}

/**
 * Importa múltiples estudiantes desde un array
 * Formato: [{ email, nombre, curso, student_code }]
 */
export const batchInviteStudents = async (institutionId, students) => {
  const { data, error } = await supabase.rpc('batch_invite_students', {
    p_institution_id: institutionId,
    p_students: students
  })

  if (error) {
    console.error('Error batch inviting students:', error)
    throw error
  }

  return data || []
}

/**
 * Activa una cuenta usando el código de activación
 */
export const activateAccountWithCode = async (activationCode) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase.rpc('activate_account_with_code', {
    p_activation_code: activationCode.toUpperCase(),
    p_user_id: user.id
  })

  if (error) {
    console.error('Error activating account:', error)
    throw error
  }

  return data
}

/**
 * Verifica si existe un perfil pendiente con un código de activación
 */
export const checkActivationCode = async (code) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, nombre, user_email, curso, institution_id')
    .eq('activation_code', code.toUpperCase())
    .eq('is_activated', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No encontrado
    }
    throw error
  }

  return data
}

/**
 * Obtiene estudiantes de una institución
 */
export const getInstitutionStudents = async (institutionId = null) => {
  const instId = institutionId || await getCurrentInstitutionId()
  if (!instId) {
    throw new Error('No se encontró institución')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      test_results (
        id,
        codigo_holland,
        certeza,
        completed_at
      )
    `)
    .eq('institution_id', instId)
    .eq('role', 'estudiante')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching institution students:', error)
    throw error
  }

  return data || []
}

/**
 * Obtiene estudiantes pendientes de activación
 */
export const getPendingStudents = async (institutionId = null) => {
  const instId = institutionId || await getCurrentInstitutionId()
  if (!instId) {
    throw new Error('No se encontró institución')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('institution_id', instId)
    .eq('role', 'estudiante')
    .eq('is_activated', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending students:', error)
    throw error
  }

  return data || []
}

/**
 * Obtiene estudiantes por curso
 */
export const getStudentsByCourse = async (curso, institutionId = null) => {
  const instId = institutionId || await getCurrentInstitutionId()
  if (!instId) {
    throw new Error('No se encontró institución')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('institution_id', instId)
    .eq('role', 'estudiante')
    .eq('curso', curso)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error fetching students by course:', error)
    throw error
  }

  return data || []
}

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * Obtiene estadísticas de la institución
 */
export const getInstitutionStats = async (institutionId = null) => {
  const instId = institutionId || await getCurrentInstitutionId()
  if (!instId) {
    throw new Error('No se encontró institución')
  }

  // Obtener usuarios de la institución
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, role, status, curso, is_activated')
    .eq('institution_id', instId)

  if (usersError) throw usersError

  // Contar por rol
  const stats = {
    total_users: users.length,
    students: {
      total: users.filter(u => u.role === 'estudiante').length,
      active: users.filter(u => u.role === 'estudiante' && u.status === 'active').length,
      pending_activation: users.filter(u => u.role === 'estudiante' && !u.is_activated).length,
      by_course: {}
    },
    orientadores: users.filter(u => u.role === 'orientador').length,
    apoderados: users.filter(u => u.role === 'apoderado').length,
    admins: users.filter(u => u.role === 'admin_colegio').length
  }

  // Agrupar estudiantes por curso
  users
    .filter(u => u.role === 'estudiante' && u.curso)
    .forEach(u => {
      stats.students.by_course[u.curso] = (stats.students.by_course[u.curso] || 0) + 1
    })

  // Obtener tests completados
  const studentIds = users.filter(u => u.role === 'estudiante').map(u => u.id)
  if (studentIds.length > 0) {
    const { count: testsCount } = await supabase
      .from('test_results')
      .select('id', { count: 'exact', head: true })
      .in('user_id', studentIds)

    stats.tests_completed = testsCount || 0
    stats.completion_rate = stats.students.active > 0
      ? Math.round((testsCount / stats.students.active) * 100)
      : 0
  } else {
    stats.tests_completed = 0
    stats.completion_rate = 0
  }

  return stats
}

/**
 * Obtiene estadísticas de todas las instituciones (solo super_admin)
 */
export const getAllInstitutionStats = async () => {
  const { data, error } = await supabase
    .from('institution_stats')
    .select('*')
    .order('institution_name', { ascending: true })

  if (error) {
    console.error('Error fetching institution stats:', error)
    throw error
  }

  return data || []
}

// ============================================
// GESTIÓN DE ADMINS DE COLEGIO
// ============================================

/**
 * Asigna un usuario como admin de colegio
 */
export const assignInstitutionAdmin = async (userId, institutionId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      role: 'admin_colegio',
      institution_id: institutionId,
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error assigning institution admin:', error)
    throw error
  }

  return data
}

/**
 * Asigna un orientador a una institución
 */
export const assignOrientadorToInstitution = async (userId, institutionId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      institution_id: institutionId,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('role', 'orientador')
    .select()
    .single()

  if (error) {
    console.error('Error assigning orientador:', error)
    throw error
  }

  return data
}

// ============================================
// UTILIDADES DE IMPORTACIÓN
// ============================================

/**
 * Parsea un CSV de estudiantes
 * Formato esperado: email,nombre,curso,codigo_estudiante
 */
export const parseStudentsCSV = (csvContent) => {
  const lines = csvContent.trim().split('\n')
  const students = []
  const errors = []

  // Saltar header si existe
  const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(',').map(p => p.trim())

    if (parts.length < 3) {
      errors.push({ line: i + 1, error: 'Formato inválido, se requiere: email,nombre,curso' })
      continue
    }

    const [email, nombre, curso, student_code] = parts

    // Validar email
    if (!email || !email.includes('@')) {
      errors.push({ line: i + 1, error: `Email inválido: ${email}` })
      continue
    }

    // Validar nombre
    if (!nombre || nombre.length < 2) {
      errors.push({ line: i + 1, error: 'Nombre muy corto' })
      continue
    }

    // Validar curso
    const validCourses = ['3 Medio', '4 Medio', '3° Medio', '4° Medio', '3ro Medio', '4to Medio']
    const normalizedCurso = curso.replace(/°|º|ro|to/g, '').trim()
    const finalCurso = normalizedCurso.includes('3') ? '3 Medio' : normalizedCurso.includes('4') ? '4 Medio' : curso

    if (!validCourses.some(c => c.toLowerCase().includes(finalCurso.toLowerCase().replace(' medio', '')))) {
      errors.push({ line: i + 1, error: `Curso no válido: ${curso}` })
      continue
    }

    students.push({
      email: email.toLowerCase(),
      nombre,
      curso: finalCurso,
      student_code: student_code || null
    })
  }

  return { students, errors }
}

/**
 * Genera un archivo de códigos de activación para imprimir
 */
export const generateActivationReport = (results) => {
  const successful = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'error')

  let report = `CÓDIGOS DE ACTIVACIÓN - VOCARI\n`
  report += `Generado: ${new Date().toLocaleString('es-CL')}\n`
  report += `======================================\n\n`

  if (successful.length > 0) {
    report += `ESTUDIANTES CREADOS (${successful.length}):\n`
    report += `-----------------------------------------\n`
    successful.forEach(s => {
      report += `${s.nombre}\n`
      report += `  Email: ${s.email}\n`
      report += `  Código: ${s.activation_code}\n\n`
    })
  }

  if (failed.length > 0) {
    report += `\nERRORES (${failed.length}):\n`
    report += `-----------------------------------------\n`
    failed.forEach(f => {
      report += `${f.email}: ${f.error}\n`
    })
  }

  return report
}

// ============================================
// EXPORTAR DATOS
// ============================================

/**
 * Exporta estudiantes de la institución a CSV
 */
export const exportStudentsToCSV = async (institutionId = null) => {
  const students = await getInstitutionStudents(institutionId)

  let csv = 'nombre,email,curso,codigo_estudiante,estado,activado,fecha_creacion,test_completado\n'

  students.forEach(s => {
    const testCompleted = s.test_results && s.test_results.length > 0 ? 'Si' : 'No'
    csv += `"${s.nombre}","${s.user_email}","${s.curso || ''}","${s.student_code || ''}","${s.status}","${s.is_activated ? 'Si' : 'No'}","${new Date(s.created_at).toLocaleDateString('es-CL')}","${testCompleted}"\n`
  })

  return csv
}
