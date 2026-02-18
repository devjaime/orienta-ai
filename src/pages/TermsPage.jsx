import { motion } from 'framer-motion';
import { FileText, Shield, CheckCircle, AlertTriangle, Users, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
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
              Términos y Condiciones
            </h1>
            <p className="text-gray-600">
              Última actualización: 18 de Febrero 2026
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10 space-y-8">
            
            {/* Section 1: Introducción */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-vocari-primary" />
                1. Introducción
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Bienvenido a <strong>Vocari</strong> (en adelante "Vocari", "nosotros" o "nuestra plataforma"). 
                  Estos Términos y Condiciones ("T&C") regulan el uso de nuestra plataforma de orientación vocacional 
                  ubicada en vocari.cl (el "Servicio").
                </p>
                <p>
                  Al acceder, registrarte o utilizar Vocari, aceptas vincularte por estos T&C. 
                  Si no estás de acuerdo con alguna disposición, te solicitamos no utilizar la plataforma.
                </p>
              </div>
            </section>

            {/* Section 2: Servicios */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-vocari-primary" />
                2. Servicios Vocari
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>Vocari ofrece los siguientes servicios:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Test Vocacional RIASEC:</strong> Evaluación psicométrica gratuita para identificar tu perfil vocacional.</li>
                  <li><strong>Informes Vocacionales:</strong> Reportes detallados con recomendaciones de carreras basadas en datos del MINEDUC.</li>
                  <li><strong>Sesiones con Orientadores:</strong> Sesiones personalizadas con profesionales de orientación vocacional.</li>
                  <li><strong>Plataforma B2B para Colegios:</strong> Herramientas para instituciones educativas.</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Informes Pagados */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-vocari-primary" />
                3. Informes Vocacionales Pagados
              </h2>
              <div className="text-gray-600 space-y-4">
                <h3 className="font-semibold text-vocari-dark">3.1 Planes Disponibles</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-vocari-dark">Plan</th>
                        <th className="text-left py-2 text-vocari-dark">Precio</th>
                        <th className="text-left py-2 text-vocari-dark">Incluye</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      <tr className="border-b border-gray-100">
                        <td className="py-2">Esencial</td>
                        <td className="py-2">$12 USD</td>
                        <td className="py-2">Informe PDF + Análisis RIASEC + Carreras MINEDUC + Revisión orientador</td>
                      </tr>
                      <tr>
                        <td className="py-2">Premium</td>
                        <td className="py-2">$20 USD</td>
                        <td className="py-2">Todo lo anterior + Explicación visual personalizada + Resumen animado</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="font-semibold text-vocari-dark">3.2 Proceso de Pago</h3>
                <p>
                  Los pagos se procesan de forma segura a través de <strong>PayPal</strong>. 
                  Al realizar el pago, aceptas las políticas de PayPal. Vocari no almacena tus datos de pago.
                </p>

                <h3 className="font-semibold text-vocari-dark">3.3 Entrega del Informe</h3>
                <p>
                  Una vez confirmado el pago, el informe será revisado por un orientador calificado 
                  y entregado en un plazo de <strong>3 a 5 días hábiles</strong>. 
                  El informe se enviará al correo electrónico registrado.
                </p>

                <h3 className="font-semibold text-vocari-dark">3.4 Política de Reembolso</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-yellow-800 text-sm">
                      <p className="font-semibold mb-1">Nota importante:</p>
                      <p>
                        Dado que los informes vocacionales son productos personalizados basados en 
                        tu test RIASEC, <strong>no se ofrecen reembolsos</strong> una vez iniciado 
                        el proceso de generación del informe.
                      </p>
                      <p className="mt-2">
                        Si tienes problemas con tu informe, contactanos antes de solicitar un reembolso.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Usuarios Menores de Edad */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-vocari-primary" />
                4. Usuarios Menores de Edad
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Vocari está diseñado principalmente para jóvenes entre <strong>14 y 24 años</strong>. 
                  Si eres menor de 18 años, debes contar con autorización de tus padres o tutor legal 
                  para utilizar los servicios pagos.
                </p>
                <p>
                  El test vocacional gratuito no requiere autorización, pero los informes pagados 
                  y sesiones con orientadores sí pueden requerir verificación de edad.
                </p>
              </div>
            </section>

            {/* Section 5: Privacidad */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-vocari-primary" />
                5. Privacidad y Protección de Datos
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Tu privacidad es importante para nosotros. Vocari opera bajo las normativas chilenas 
                  de protección de datos personales (Ley 19.628 y modificaciones).
                </p>
                <p>
                  <strong>No vendemos tus datos personales</strong>. Utilizamos tu información únicamente 
                  para proporcionar los servicios de orientación vocacional.
                </p>
                <p>
                  Al usar Vocari, aceptas nuestro procesamiento de datos tal como se describe en nuestra 
                  <Link to="/privacidad" className="text-vocari-primary hover:underline ml-1">
                    Política de Privacidad
                  </Link>.
                </p>
              </div>
            </section>

            {/* Section 6: Limitaciones */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-vocari-primary" />
                6. Limitaciones y Exención de Responsabilidad
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  <strong>Información educativa únicamente:</strong> Las recomendaciones de carrera 
                  proporcionadas por Vocari son orientativas y se basan en datos estadísticos del MINEDUC. 
                  No constituyen asesoramiento profesional definitivo.
                </p>
                <p>
                  <strong>No garantizamos empleo:</strong> Vocari no garantiza la admisión a universidades, 
                  empleo específico ni éxito profesional derivado de las recomendaciones.
                </p>
                <p>
                  <strong>Responsabilidad:</strong> Vocari no será responsable por decisiones de carrera 
                  tomadas basadas en nuestros servicios. Recomendamos siempre consultar con profesionales 
                  de orientación y familias.
                </p>
              </div>
            </section>

            {/* Section 7: Contacto */}
            <section>
              <h2 className="text-xl font-bold text-vocari-dark mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-vocari-primary" />
                7. Contacto
              </h2>
              <div className="text-gray-600 space-y-3">
                <p>Para consultas sobre estos T&C o los servicios:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Email:</strong> contacto@vocari.cl</li>
                  <li><strong>Sitio web:</strong> vocari.cl</li>
                </ul>
              </div>
            </section>

            {/* Acceptance */}
            <div className="bg-vocari-primary/5 border border-vocari-primary/20 rounded-xl p-4 mt-8">
              <p className="text-sm text-gray-600 text-center">
                Al utilizar Vocari, confirmas que has leído, entendido y aceptas estos Términos y Condiciones. 
                Si no estás de acuerdo, por favor no utilices la plataforma.
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
