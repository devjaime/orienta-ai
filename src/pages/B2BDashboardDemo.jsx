import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  School, Users, FileText, TrendingUp, 
  Search, Filter, Download, Eye, 
  CheckCircle, AlertCircle, Clock, BarChart3,
  GraduationCap, MapPin, Calendar, ChevronRight
} from 'lucide-react'

// Datos de ejemplo para demo
const estudiantesDemo = [
  { id: 1, nombre: 'Mateo González', curso: '4° Medio A', progreso: 100, estado: 'completo', fecha: '2026-02-15', perfil: 'SIA' },
  { id: 2, nombre: 'Sofia López', curso: '4° Medio B', progreso: 75, estado: 'en_progreso', fecha: '2026-02-14', perfil: 'IRE' },
  { id: 3, nombre: 'Benjamín Ruiz', curso: '4° Medio A', progreso: 100, estado: 'completo', fecha: '2026-02-13', perfil: 'RCS' },
  { id: 4, nombre: 'Isidora Mena', curso: '3° Medio A', progreso: 45, estado: 'en_progreso', fecha: '2026-02-12', perfil: null },
  { id: 5, nombre: 'Santiago Torres', curso: '4° Medio B', progreso: 100, estado: 'completo', fecha: '2026-02-11', perfil: 'ESA' },
  { id: 6, nombre: 'Valentina Rojas', curso: '4° Medio A', progreso: 30, estado: 'en_progreso', fecha: '2026-02-10', perfil: null },
]

const statsDemo = {
  total: 156,
  completados: 89,
  enProgreso: 42,
  pendientes: 25,
  topPerfiles: [
    { perfil: 'SIA', count: 28, label: 'Social-Investigativo-Artístico' },
    { perfil: 'IRE', count: 22, label: 'Investigativo-Realista-Empresarial' },
    { perfil: 'RCE', count: 18, label: 'Realista-Convencional-Empresarial' },
  ]
}

const carrerasTopDemo = [
  { nombre: 'Psicología', count: 24 },
  { nombre: 'Ingeniería Civil', count: 18 },
  { nombre: 'Medicina', count: 15 },
  { nombre: 'Diseño Gráfico', count: 12 },
  { nombre: 'Pedagogía', count: 11 },
]

export default function B2BDashboardDemo() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')

  const filteredEstudiantes = estudiantesDemo.filter(e => {
    const matchesSearch = e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterEstado === 'todos' || e.estado === filterEstado
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-vocari-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-vocari-primary rounded-xl flex items-center justify-center">
                <School size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Colegio Demo</h1>
                <p className="text-sm text-white/70">Portal de Orientación Vocacional</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <Clock size={16} />
              <span className="text-sm">Demo - Sin datos reales</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-vocari-primary" size={20} />
              <span className="text-gray-500 text-sm">Total Estudiantes</span>
            </div>
            <div className="text-3xl font-black text-vocari-dark">{statsDemo.total}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-gray-500 text-sm">Completados</span>
            </div>
            <div className="text-3xl font-black text-green-600">{statsDemo.completados}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-yellow-500" size={20} />
              <span className="text-gray-500 text-sm">En Progreso</span>
            </div>
            <div className="text-3xl font-black text-yellow-600">{statsDemo.enProgreso}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="text-gray-400" size={20} />
              <span className="text-gray-500 text-sm">Pendientes</span>
            </div>
            <div className="text-3xl font-black text-gray-600">{statsDemo.pendientes}</div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Lista de Estudiantes */}
          <div className="md:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-vocari-dark">Estudiantes</h2>
                  <button className="text-sm text-vocari-primary hover:text-vocari-light font-medium">
                    Exportar CSV
                  </button>
                </div>
                
                {/* Filters */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar estudiante..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-vocari-primary"
                    />
                  </div>
                  <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-vocari-primary"
                  >
                    <option value="todos">Todos</option>
                    <option value="completo">Completados</option>
                    <option value="en_progreso">En Progreso</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Curso</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Progreso</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEstudiantes.map((estudiante) => (
                      <tr key={estudiante.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-vocari-dark">{estudiante.nombre}</div>
                          <div className="text-xs text-gray-400">{estudiante.fecha}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{estudiante.curso}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  estudiante.progreso === 100 ? 'bg-green-500' : 'bg-vocari-primary'
                                }`}
                                style={{ width: `${estudiante.progreso}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{estudiante.progreso}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            estudiante.estado === 'completo' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {estudiante.estado === 'completo' ? (
                              <><CheckCircle size={12} /> Completado</>
                            ) : (
                              <><Clock size={12} /> En Progreso</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-vocari-primary hover:text-vocari-light font-medium text-sm flex items-center gap-1">
                            Ver <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Perfiles */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-vocari-primary" size={20} />
                <h3 className="font-bold text-vocari-dark">Perfiles Dominantes</h3>
              </div>
              <div className="space-y-3">
                {statsDemo.topPerfiles.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-vocari-dark">{item.perfil}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                    <div className="text-lg font-black text-vocari-primary">{item.count}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Carreras Populares */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-vocari-accent" size={20} />
                <h3 className="font-bold text-vocari-dark">Carreras Populares</h3>
              </div>
              <div className="space-y-3">
                {carrerasTopDemo.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-vocari-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-vocari-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700">{item.nombre}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-500">{item.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-vocari-primary to-vocari-dark rounded-xl p-6 text-white"
            >
              <h3 className="font-bold mb-2">¿Te interesa este portal?</h3>
              <p className="text-sm text-white/80 mb-4">
                Obtén acceso completo para tu establecimiento educativo.
              </p>
              <button className="w-full bg-white text-vocari-primary font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors">
                Solicitar Demo
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
