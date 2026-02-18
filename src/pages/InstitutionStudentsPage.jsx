/**
 * InstitutionStudentsPage - Gestión de estudiantes de una institución
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Download,
  RefreshCw,
  BookOpen,
  Mail,
  MoreVertical,
  Eye,
  Trash2
} from 'lucide-react';
import {
  getInstitutionById,
  getInstitutionStudents,
  getInstitutionStats,
  exportStudentsToCSV
} from '../lib/institutionService';
import StudentImporter from '../components/admin/StudentImporter';

function InstitutionStudentsPage() {
  const { institutionId } = useParams();
  const navigate = useNavigate();

  const [institution, setInstitution] = useState(null);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurso, setFilterCurso] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showImporter, setShowImporter] = useState(false);

  useEffect(() => {
    loadData();
  }, [institutionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instData, studentsData, statsData] = await Promise.all([
        getInstitutionById(institutionId),
        getInstitutionStudents(institutionId),
        getInstitutionStats(institutionId)
      ]);
      setInstitution(instData);
      setStudents(studentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportStudentsToCSV(institutionId);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estudiantes_${institution?.code || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCurso = filterCurso === 'all' || student.curso === filterCurso;

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'activated' && student.is_activated) ||
      (filterStatus === 'pending' && !student.is_activated) ||
      (filterStatus === 'with_test' && student.test_results?.length > 0) ||
      (filterStatus === 'no_test' && (!student.test_results || student.test_results.length === 0));

    return matchesSearch && matchesCurso && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-vocari-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-white">Institución no encontrada</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 bg-vocari-primary text-white rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-white" size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">{institution.name}</h1>
                <p className="text-white/60 text-sm">Código: {institution.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                <Download size={16} />
                Exportar
              </button>
              <button
                onClick={() => setShowImporter(true)}
                className="flex items-center gap-2 px-3 py-2 bg-vocari-primary hover:bg-vocari-light rounded-lg text-white text-sm transition-colors"
              >
                <Plus size={16} />
                Agregar Estudiantes
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Estudiantes"
            value={stats?.students?.total || 0}
            icon={Users}
            color="indigo"
          />
          <StatCard
            label="Activados"
            value={stats?.students?.active || 0}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Sin Activar"
            value={stats?.students?.pending_activation || 0}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            label="Tests Completados"
            value={stats?.tests_completed || 0}
            icon={BookOpen}
            color="blue"
          />
        </div>

        {/* Filtros */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-vocari-primary"
              />
            </div>

            <select
              value={filterCurso}
              onChange={(e) => setFilterCurso(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
            >
              <option value="all">Todos los cursos</option>
              <option value="3 Medio">3° Medio</option>
              <option value="4 Medio">4° Medio</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
            >
              <option value="all">Todos los estados</option>
              <option value="activated">Activados</option>
              <option value="pending">Sin activar</option>
              <option value="with_test">Con test</option>
              <option value="no_test">Sin test</option>
            </select>

            <button
              onClick={loadData}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
              title="Refrescar"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Lista de estudiantes */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-white/30" />
              <p className="text-white/60">No se encontraron estudiantes</p>
              <button
                onClick={() => setShowImporter(true)}
                className="mt-4 px-4 py-2 bg-vocari-primary text-white rounded-lg text-sm"
              >
                Agregar estudiantes
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white/70 font-medium">Estudiante</th>
                    <th className="text-left p-4 text-white/70 font-medium">Curso</th>
                    <th className="text-left p-4 text-white/70 font-medium">Estado</th>
                    <th className="text-left p-4 text-white/70 font-medium">Test</th>
                    <th className="text-left p-4 text-white/70 font-medium">Fecha</th>
                    <th className="text-right p-4 text-white/70 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <StudentRow key={student.id} student={student} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="mt-4 text-white/50 text-sm">
          Mostrando {filteredStudents.length} de {students.length} estudiantes
        </div>
      </main>

      {/* Modal Importador */}
      {showImporter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowImporter(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Agregar Estudiantes</h2>
              <button
                onClick={() => setShowImporter(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="text-white/60" size={20} />
              </button>
            </div>
            <div className="p-6">
              <StudentImporter
                institutionId={institutionId}
                institutionName={institution.name}
                onImportComplete={() => {
                  loadData();
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Componente StatCard
function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    indigo: 'bg-vocari-primary/20 text-vocari-light',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-white/60 text-sm">{label}</p>
    </div>
  );
}

// Componente StudentRow
function StudentRow({ student }) {
  const [showMenu, setShowMenu] = useState(false);
  const hasTest = student.test_results && student.test_results.length > 0;
  const latestTest = hasTest ? student.test_results[0] : null;

  return (
    <tr className="border-t border-white/5 hover:bg-white/5 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vocari-primary/20 rounded-full flex items-center justify-center">
            <span className="text-vocari-light font-medium">
              {student.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-medium">{student.nombre}</p>
            <p className="text-white/50 text-sm flex items-center gap-1">
              <Mail size={12} />
              {student.user_email}
            </p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="px-2 py-1 bg-white/10 rounded text-white/70 text-sm">
          {student.curso || '-'}
        </span>
      </td>
      <td className="p-4">
        {student.is_activated ? (
          <span className="flex items-center gap-1 text-green-400 text-sm">
            <CheckCircle size={14} />
            Activado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-yellow-400 text-sm">
            <Clock size={14} />
            Pendiente
          </span>
        )}
      </td>
      <td className="p-4">
        {hasTest ? (
          <div>
            <span className="text-vocari-light font-mono font-bold">
              {latestTest.codigo_holland}
            </span>
            <p className="text-white/40 text-xs">
              {new Date(latestTest.completed_at).toLocaleDateString('es-CL')}
            </p>
          </div>
        ) : (
          <span className="text-white/40 text-sm">Sin test</span>
        )}
      </td>
      <td className="p-4 text-white/50 text-sm">
        {new Date(student.created_at).toLocaleDateString('es-CL')}
      </td>
      <td className="p-4 text-right">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="text-white/60" size={16} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-xl z-20 py-1 min-w-[150px]">
                <button className="w-full px-4 py-2 text-left text-white/70 hover:bg-white/10 flex items-center gap-2 text-sm">
                  <Eye size={14} />
                  Ver perfil
                </button>
                {!student.is_activated && (
                  <button className="w-full px-4 py-2 text-left text-yellow-400 hover:bg-white/10 flex items-center gap-2 text-sm">
                    <RefreshCw size={14} />
                    Reenviar código
                  </button>
                )}
                <button className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/10 flex items-center gap-2 text-sm">
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default InstitutionStudentsPage;
