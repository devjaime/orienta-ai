import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Rutas publicas - carga inmediata
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';

// Lazy loading para rutas protegidas (mejora performance inicial)
const TestRIASEC = lazy(() => import('./pages/TestRIASEC'));
const Resultados = lazy(() => import('./pages/Resultados'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const ActivateAccount = lazy(() => import('./pages/ActivateAccount'));
const InstitutionStudentsPage = lazy(() => import('./pages/InstitutionStudentsPage'));

// Paginas de informes pagados - lazy loading
const InformesPage = lazy(() => import('./pages/InformesPage'));
const MisInformesPage = lazy(() => import('./pages/MisInformesPage'));
const FlowReturnPage = lazy(() => import('./pages/FlowReturnPage'));

// Paginas del sistema orientador - lazy loading
const OrientadorDashboardPage = lazy(() => import('./pages/OrientadorDashboardPage'));
const OrientadorStudentProfilePage = lazy(() => import('./pages/OrientadorStudentProfilePage'));
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage'));
const SessionNotesPage = lazy(() => import('./pages/SessionNotesPage'));

// Landing B2B - lazy loading
const B2BLandingPage = lazy(() => import('./pages/B2BLandingPage'));

// Componentes
import WhatsAppFloat from './components/WhatsAppFloat';
import UrgencyBanner from './components/UrgencyBanner';
import SocialProof from './components/SocialProof';
import ExitIntentPopup from './components/ExitIntentPopup';

// Legal - lazy loading
const TermsPage = lazy(() => import('./pages/TermsPage'));

// Componente de proteccion de rutas
import ProtectedRoute from './components/ProtectedRoute';

// Loading fallback para lazy loaded components
const LoadingFallback = () => (
  <div className="min-h-screen bg-vocari-bg flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-vocari-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500">Cargando...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <UrgencyBanner />
      <WhatsAppFloat />
      <SocialProof />
      <ExitIntentPopup />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Rutas publicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/colegios" element={<B2BLandingPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/activate" element={<ActivateAccount />} />

        {/* Rutas de informes pagados */}
        <Route path="/informes" element={<InformesPage />} />
        <Route
          path="/mis-informes"
          element={
            <ProtectedRoute allowedRoles={['estudiante', 'apoderado', 'orientador', 'admin', 'admin_colegio', 'super_admin']}>
              <MisInformesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/flow-return" element={<FlowReturnPage />} />

        {/* Ruta del test - SOLO para estudiantes */}
        <Route
          path="/test"
          element={
            <ProtectedRoute
              allowedRoles={['estudiante']}
              customMessage="El test vocacional esta disponible solo para estudiantes. Orientadores y apoderados pueden ver los resultados de sus estudiantes."
            >
              <TestRIASEC />
            </ProtectedRoute>
          }
        />

        {/* Resultados - Solo estudiantes */}
        <Route
          path="/resultados"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <Resultados />
            </ProtectedRoute>
          }
        />

        {/* Dashboard estudiante */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard apoderado */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['apoderado']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas del sistema orientador */}
        <Route
          path="/orientador"
          element={
            <ProtectedRoute allowedRoles={['orientador', 'admin']}>
              <OrientadorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/dashboard"
          element={
            <ProtectedRoute allowedRoles={['orientador', 'admin']}>
              <OrientadorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/disponibilidad"
          element={
            <ProtectedRoute allowedRoles={['orientador', 'admin']}>
              <AvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/estudiante/:studentId"
          element={
            <ProtectedRoute allowedRoles={['orientador', 'admin']}>
              <OrientadorStudentProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/notas/:sessionId"
          element={
            <ProtectedRoute allowedRoles={['orientador', 'admin']}>
              <SessionNotesPage />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard - Administradores (admin, admin_colegio, super_admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'admin_colegio', 'super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Gestion de estudiantes por institucion */}
        <Route
          path="/admin/institutions/:institutionId/students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'admin_colegio', 'super_admin']}>
              <InstitutionStudentsPage />
            </ProtectedRoute>
          }
        />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
