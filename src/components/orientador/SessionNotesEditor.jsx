import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Save,
  Sparkles,
  Tag,
  AlertCircle,
  CheckCircle,
  Calendar,
  Loader
} from 'lucide-react';
import {
  getSessionNotes,
  saveSessionNotes,
  generateNotesAISummary
} from '../../lib/orientadorService';
import { getCurrentUser } from '../../lib/supabase';

function SessionNotesEditor({ sessionId, onSave }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState(null);
  const [rawNotes, setRawNotes] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    loadNotes();
  }, [sessionId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (sessionId) {
        const existingNotes = await getSessionNotes(sessionId);
        if (existingNotes) {
          setNotes(existingNotes);
          setRawNotes(existingNotes.raw_notes);
          setTags(existingNotes.tags || []);
          setFollowUpNeeded(existingNotes.follow_up_needed || false);
          setFollowUpDate(existingNotes.follow_up_date || '');
          setAiSummary(existingNotes.ai_summary);
          setAiAnalysis(existingNotes.ai_analysis);
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!rawNotes.trim()) {
      alert('Escribe algunas notas antes de guardar');
      return;
    }

    setSaving(true);
    try {
      const savedNotes = await saveSessionNotes(
        sessionId,
        user.id,
        rawNotes,
        tags
      );
      setNotes(savedNotes);
      if (onSave) onSave(savedNotes);
      alert('Notas guardadas exitosamente');
    } catch (error) {
      alert('Error guardando notas: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!rawNotes.trim()) {
      alert('Escribe algunas notas antes de generar el resumen IA');
      return;
    }

    if (rawNotes.length < 50) {
      alert('Las notas son muy cortas. Escribe al menos 50 caracteres para obtener un buen análisis.');
      return;
    }

    setGeneratingAI(true);
    try {
      const result = await generateNotesAISummary(sessionId, rawNotes);
      setAiSummary(result.ai_summary);
      setAiAnalysis(result.ai_analysis);
      alert('Resumen IA generado exitosamente');
    } catch (error) {
      alert('Error generando resumen IA: ' + error.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  if (loading) {
    return <div className="text-white">Cargando notas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Editor de notas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/20 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-blue-400" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-white">Apuntes de Sesión</h2>
            <p className="text-white/60 text-sm">
              Registra tus observaciones y puntos importantes
            </p>
          </div>
        </div>

        {/* Área de texto */}
        <textarea
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          placeholder="Escribe tus apuntes aquí... (ej: El estudiante mostró interés en carreras de salud, mencionó dudas sobre medicina vs enfermería...)"
          className="w-full h-64 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center justify-between mt-4">
          <span className="text-white/60 text-sm">
            {rawNotes.length} caracteres
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateAI}
              disabled={generatingAI || rawNotes.length < 50}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingAI ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generar Resumen IA
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/20 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Tag className="text-purple-400" size={24} />
          <h3 className="text-xl font-bold text-white">Etiquetas</h3>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Agregar etiqueta (ej: vocación, familia, indecisión...)"
            className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Agregar
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-purple-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Seguimiento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 border border-white/20 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-yellow-400" size={24} />
          <h3 className="text-xl font-bold text-white">Seguimiento</h3>
        </div>

        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={followUpNeeded}
            onChange={(e) => setFollowUpNeeded(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-white">Requiere seguimiento</span>
        </label>

        {followUpNeeded && (
          <div>
            <label className="block text-white/60 text-sm mb-2">
              Fecha de seguimiento
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </motion.div>

      {/* Resumen IA */}
      {aiSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-purple-400" size={24} />
            <h3 className="text-xl font-bold text-white">Resumen IA</h3>
          </div>

          <p className="text-white/80 mb-6">{aiSummary}</p>

          {/* Análisis estructurado */}
          {aiAnalysis && (
            <div className="space-y-4">
              {/* Puntos clave */}
              {aiAnalysis.puntos_clave?.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-400" />
                    Puntos Clave
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-white/70">
                    {aiAnalysis.puntos_clave.map((punto, idx) => (
                      <li key={idx}>{punto}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendaciones */}
              {aiAnalysis.recomendaciones?.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-400" />
                    Recomendaciones
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-white/70">
                    {aiAnalysis.recomendaciones.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Próximos pasos */}
              {aiAnalysis.proximos_pasos?.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Calendar size={18} className="text-yellow-400" />
                    Próximos Pasos
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-white/70">
                    {aiAnalysis.proximos_pasos.map((paso, idx) => (
                      <li key={idx}>{paso}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Áreas de preocupación */}
              {aiAnalysis.areas_preocupacion?.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-400" />
                    Áreas de Preocupación
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-white/70">
                    {aiAnalysis.areas_preocupacion.map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-6 text-sm text-white/60 pt-4 border-t border-white/10">
                <span>
                  Sentimiento: <strong>{aiAnalysis.sentimiento_general}</strong>
                </span>
                <span>
                  Compromiso: <strong>{aiAnalysis.nivel_compromiso}</strong>
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default SessionNotesEditor;
