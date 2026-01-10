import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TestRIASEC from './pages/TestRIASEC';
import Resultados from './pages/Resultados';
import AuthCallback from './pages/AuthCallback';
import CompleteProfile from './pages/CompleteProfile';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import ParentDashboard from './pages/ParentDashboard';

// Páginas del sistema orientador
import OrientadorDashboardPage from './pages/OrientadorDashboardPage';
import OrientadorStudentProfilePage from './pages/OrientadorStudentProfilePage';
import AvailabilityPage from './pages/AvailabilityPage';
import SessionNotesPage from './pages/SessionNotesPage';

// Componente de protección de rutas
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />

        {/* Ruta del test - SOLO para estudiantes */}
        <Route
          path="/test"
          element={
            <ProtectedRoute
              allowedRoles={['estudiante']}
              customMessage="El test vocacional está disponible solo para estudiantes. Orientadores y apoderados pueden ver los resultados de sus estudiantes."
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

        {/* Admin dashboard - Solo administradores */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
