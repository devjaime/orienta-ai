import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TestRIASEC from './pages/TestRIASEC';
import Resultados from './pages/Resultados';
import AuthCallback from './pages/AuthCallback';
import CompleteProfile from './pages/CompleteProfile';
import OrientadorDashboard from './pages/OrientadorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import ParentDashboard from './pages/ParentDashboard';

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
        <Route path="/orientador" element={<OrientadorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
