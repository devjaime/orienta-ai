import { Shield, Eye, Database, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-vocari-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-vocari-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
              Política de Privacidad
            </h1>
            <p className="text-gray-600">
              Última actualización: 20 de Febrero 2026
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10 space-y-8">
            
            {/* Section 1: Introducción */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-vocari-primary" />
                1. Introducción
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  En <strong>Vocari</strong>, nos comprometemos a proteger tu privacidad. 
                  Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos 
                  y protegemos tu información personal.
                </p>
                <p>
                  Al utilizar Vocari (vocari.cl), aceptas las prácticas descritas en esta política.
                </p>
              </div>
            </section>

            {/* Section 2: Información que recopilamos */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-vocari-primary" />
                2. Información que Recopilamos
              </h2>
              <div className="text-gray-600 space-y-4">
                <h3 className="font-semibold text-vocari-dark">2.1 Información que nos proporcionas</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Datos del test vocacional:</strong> Respuestas a las preguntas RIASEC, perfil vocacional resultante.</li>
                  <li><strong>Información de perfil:</strong> Nombre, correo electrónico, fecha de nacimiento, establecimiento educacional.</li>
                  <li><strong>Datos de pago:</strong> Información procesada por Flow.cl (nosotros no almacenamos datos de tarjeta).</li>
                  <li><strong> Comunicaciones:</strong> Mensajes que nos envías a través de cualquier canal.</li>
                </ul>

                <h3 className="font-semibold text-vocari-dark mt-4">2.2 Información recopilada automáticamente</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Datos de uso:</strong> Páginas visitadas, tiempo en el sitio, interacciones.</li>
                  <li><strong>Información del dispositivo:</strong> Tipo de navegador, sistema operativo, dirección IP.</li>
                  <li><strong>Cookies:</strong> Para mejorar la experiencia del usuario y análisis.</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Cómo usamos tu información */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-vocari-primary" />
                3. Cómo Usamos Tu Información
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>Utilizamos tu información para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Proporcionar servicios:</strong> Entregar el test vocacional y generar informes personalizados.</li>
                  <li><strong>Mejorar nuestros servicios:</strong> Analizar usage para optimizar la plataforma.</li>
                  <li><strong>Comunicaciones:</strong> Enviar notificaciones sobre tu cuenta, informes y soporte.</li>
                  <li><strong>Cumplimiento legal:</strong> Responder a solicitudes legales y regulaciones.</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Compartir información */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-vocari-primary" />
                4. Compartir Información
              </h2>
              <div className="text-gray-600 space-y-3">
                <p><strong>NO vendemos</strong> tus datos personales. Compartimos información únicamente con:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Proveedores de servicios:</strong> Flow.cl para pagos, Supabase para base de datos (bajo acuerdos de confidencialidad).</li>
                  <li><strong>Instituciones educativas:</strong> Si eres estudiante de un colegio partner, tu orientador puede ver tus resultados.</li>
                  <li><strong>Requerimientos legales:</strong> Cuando sea requerido por autoridades chilenas.</li>
                </ul>
              </div>
            </section>

            {/* Section 5: Seguridad */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-vocari-primary" />
                5. Seguridad
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>Implementamos medidas de seguridad para proteger tu información:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encriptación SSL/TLS para数据传输</li>
                  <li>Almacenamiento seguro en Supabase (AWS)</li>
                  <li>Acceso limitado solo a personal autorizado</li>
                  <li>Monitoreo regular de seguridad</li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-yellow-800 text-sm">
                      <p className="font-semibold mb-1">Nota importante:</p>
                      <p>
                        Ningún método de transmisión por internet es 100% seguro. 
                        No podemos garantizar seguridad absoluta, pero trabajamos para proteger tus datos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Tus derechos */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-vocari-primary" />
                6. Tus Derechos (Ley 19.628 Chile)
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>Según la ley chilena de protección de datos personales, tienes derecho a:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Acceso:</strong> Solicitar información sobre los datos que tenemos tuyos.</li>
                  <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
                  <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos (con excepciones).</li>
                  <li><strong>Oposición:</strong> Opponerte al tratamiento de tus datos.</li>
                </ul>
                <p className="mt-4">
                  Para ejercer estos derechos, contactanos en <strong>contacto@vocari.cl</strong>
                </p>
              </div>
            </section>

            {/* Section 7: Menores de edad */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-vocari-primary" />
                7. Menores de Edad
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Nuestro servicio está dirigido a jóvenes de 14 años en adelante. 
                  Para usuarios menores de 18 años que deseen adquirir informes pagos, 
                  requerimos autorización de un padre o tutor legal.
                </p>
                <p>
                  El test vocacional gratuito puede ser realizado por menores sin autorización, 
                  pero los datos serán tratados con especial cuidado.
                </p>
              </div>
            </section>

            {/* Section 8: Cookies */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-vocari-primary" />
                8. Cookies y Tecnologías Similares
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>Utilizamos cookies para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mantener tu sesión iniciada</li>
                  <li>Recordar tus preferencias</li>
                  <li>Analizar tráfico y mejorar el sitio</li>
                </ul>
                <p className="mt-4">
                  Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar funcionalidades.
                </p>
              </div>
            </section>

            {/* Section 9: Cambios */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-vocari-primary" />
                9. Cambios a Esta Política
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Podemos actualizar esta política ocasionalmente. Notificaremos cambios importantes 
                  a través de la plataforma o por correo electrónico.
                </p>
                <p>
                  La fecha de "Última actualización" refleja el momento más reciente.
                </p>
              </div>
            </section>

            {/* Section 10: Contacto */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-vocari-primary" />
                10. Contacto
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>Para preguntas sobre esta política o tus datos:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Email:</strong> contacto@vocari.cl</li>
                  <li><strong>Sitio web:</strong> vocari.cl</li>
                </ul>
              </div>
            </section>

            {/* Acceptance */}
            <div className="bg-vocari-primary/5 border border-vocari-primary/20 rounded-xl p-4 mt-8">
              <p className="text-sm text-gray-600 text-center">
                Al utilizar Vocari, confirmas que has leído y entendido nuestra Política de Privacidad.
              </p>
            </div>

          </div>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-vocari-primary hover:underline"
            >
              ← Volver a Vocari
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
