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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/test" element={<TestRIASEC />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Rutas del sistema orientador */}
        <Route path="/orientador" element={<OrientadorDashboardPage />} />
        <Route path="/orientador/dashboard" element={<OrientadorDashboardPage />} />
        <Route path="/orientador/disponibilidad" element={<AvailabilityPage />} />
        <Route path="/orientador/estudiante/:studentId" element={<OrientadorStudentProfilePage />} />
        <Route path="/orientador/notas/:sessionId" element={<SessionNotesPage />} />

        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
