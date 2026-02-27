/**
 * Servicio de Integración Google Meet - Vocari
 * 
 * Este servicio gestiona la creación dinámica de salas de reunión 
 * vinculadas a la cuenta institucional hola@vocari.cl
 */

import { supabase } from './supabase';

/**
 * Crea una reunión en Google Meet vinculada a una sesión agendada
 * @param {Object} sessionData - Datos de la sesión agendada
 * @returns {Promise<string|null>} URL de la reunión de Google Meet
 */
export async function createGoogleMeetSession(sessionData) {
  try {
    console.log('Generando sala de reunión para:', sessionData.id);

    // En producción, esto llamará a una Supabase Edge Function que 
    // interactúa con la Google Calendar API usando un Service Account 
    // o un Token de OAuth2 de hola@vocari.cl
    
    const response = await fetch('/.netlify/functions/create-google-meet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: sessionData.id,
        summary: `Orientación Vocacional: ${sessionData.student_name || 'Estudiante'}`,
        description: 'Sesión de revisión de informe vocacional RIASEC con experto Vocari.',
        startTime: sessionData.scheduled_date,
        endTime: new Date(new Date(sessionData.scheduled_date).getTime() + 30 * 60000).toISOString(),
        attendees: [
          { email: sessionData.student_email },
          { email: sessionData.orientador_email || 'orientadores@vocari.cl' }
        ]
      })
    });

    if (!response.ok) {
      // Fallback: Si falla la API, generamos un link descriptivo o notificamos error
      console.warn('Falla en API Google Meet, usando modo manual.');
      return null;
    }

    const { meetLink } = await response.json();
    
    // Actualizar la sesión en Supabase con el link generado
    await supabase
      .from('scheduled_sessions')
      .update({ meet_link: meetLink })
      .eq('id', sessionData.id);

    return meetLink;

  } catch (error) {
    console.error('Error integrando Google Meet:', error);
    return null;
  }
}
