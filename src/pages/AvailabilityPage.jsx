import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AvailabilityManager from '../components/orientador/AvailabilityManager';

function AvailabilityPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-orienta-dark">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header con botón de regreso */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/orientador/dashboard')}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowLeft size={20} />
            Volver al Dashboard
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">
            Configurar Disponibilidad
          </h1>
          <p className="text-white/60">
            Define tus horarios semanales para que los estudiantes puedan agendar sesiones
          </p>
        </div>

        {/* Componente de disponibilidad */}
        <AvailabilityManager />
      </div>
    </div>
  );
}

export default AvailabilityPage;
