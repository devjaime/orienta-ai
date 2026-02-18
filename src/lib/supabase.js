import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase no configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY al archivo .env')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Helper: Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      // Handle auth session missing - user not logged in
      if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
        return null
      }
      console.error('Error getting user:', error)
      return null
    }
    return user
  } catch (err) {
    // Handle any other auth errors gracefully
    console.warn('Auth error (expected if not logged in):', err.message)
    return null
  }
}

// Helper: Sign in with Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })

  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }

  return data
}

// Helper: Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Helper: Save test result
export const saveTestResult = async (resultData) => {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  const { data, error } = await supabase
    .from('test_results')
    .insert({
      user_id: user.id,
      user_email: user.email,
      codigo_holland: resultData.codigo_holland,
      certeza: resultData.certeza,
      puntajes: resultData.puntajes,
      respuestas: resultData.respuestas,
      completed_at: new Date().toISOString(),
      duracion_minutos: resultData.duracion_minutos,
      explicacion_ia: resultData.explicacion_ia || null,
      carreras_recomendadas: resultData.carreras_recomendadas || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving test result:', error)
    throw error
  }

  return data
}

// Helper: Get user test results
export const getUserTestResults = async () => {
  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_email', user.email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching test results:', error)
    return []
  }

  return data || []
}

// Helper: Get latest test result
export const getLatestTestResult = async () => {
  const results = await getUserTestResults()
  return results.length > 0 ? results[0] : null
}

/**
 * Obtiene el perfil completo del usuario actual (incluyendo rol)
 */
export const getUserProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export const hasRole = async (requiredRole) => {
  const profile = await getUserProfile()
  if (!profile) return false

  // Admin tiene acceso a todo
  if (profile.role === 'admin') return true

  // Orientador tiene acceso a funciones de orientador
  if (requiredRole === 'orientador') {
    return profile.role === 'orientador' || profile.role === 'admin'
  }

  return profile.role === requiredRole
}

/**
 * Obtiene todos los usuarios (solo para orientadores/admins)
 */
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene todos los tests (solo para orientadores/admins)
 */
export const getAllTestResults = async () => {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all test results:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene todas las sesiones agendadas (solo para orientadores/admins)
 */
export const getAllScheduledSessions = async () => {
  const { data, error } = await supabase
    .from('scheduled_sessions')
    .select(`
      *,
      user_profile:user_profiles!scheduled_sessions_user_id_fkey(nombre, user_email, edad, genero)
    `)
    .order('scheduled_date', { ascending: true })

  if (error) {
    console.error('Error fetching scheduled sessions:', error)
    return []
  }

  return data || []
}

/**
 * Crea una nueva sesión agendada
 */
export const createScheduledSession = async (sessionData) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('scheduled_sessions')
    .insert({
      user_id: user.id,
      ...sessionData
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating scheduled session:', error)
    throw error
  }

  return data
}

/**
 * Crea una nueva sesión agendada CON asignación automática de orientador
 */
export const createScheduledSessionWithAssignment = async (sessionData) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuario no autenticado')

  // Importar función de orientadorService
  const { autoAssignOrientador } = await import('./orientadorService')

  try {
    // Asignar orientador automáticamente
    const orientadorId = await autoAssignOrientador(user.id, sessionData.scheduled_date)

    // Crear sesión con orientador asignado
    const { data, error } = await supabase
      .from('scheduled_sessions')
      .insert({
        user_id: user.id,
        orientador_id: orientadorId,
        ...sessionData
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating scheduled session:', error)
      throw error
    }

    return data
  } catch (err) {
    console.error('Error in createScheduledSessionWithAssignment:', err)
    throw err
  }
}

/**
 * Actualiza el estado de una sesión
 */
export const updateSessionStatus = async (sessionId, status, notes = null) => {
  const updateData = { status }

  if (status === 'completed' && notes) {
    updateData.orientador_notes = notes
  }

  const { data, error } = await supabase
    .from('scheduled_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating session status:', error)
    throw error
  }

  return data
}
