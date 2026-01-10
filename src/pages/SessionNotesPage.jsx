import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SessionNotesEditor from '../components/orientador/SessionNotesEditor';

function SessionNotesPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const handleSave = () => {
    // Opcional: redirigir después de guardar
    console.log('Notas guardadas');
  };

  return (
    <div className="min-h-screen bg-orienta-dark">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header con botón de regreso */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowLeft size={20} />
            Volver
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">
            Notas de Sesión
          </h1>
          <p className="text-white/60">
            Registra los puntos importantes y genera resumen con IA
          </p>
        </div>

        {/* Componente de notas */}
        <SessionNotesEditor sessionId={sessionId} onSave={handleSave} />
      </div>
    </div>
  );
}

export default SessionNotesPage;
