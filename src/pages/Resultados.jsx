import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Share2, Sparkles, TrendingUp, Award, Loader2 } from 'lucide-react';
import { calcularCodigoRIASEC, generarInterpretacion } from '../lib/riasecScoring';
import { recomendarCarreras } from '../lib/recomendacionCarreras';
import { generarExplicacionIA } from '../lib/claudeAPI';
import { saveTestResult } from '../lib/supabase';
import { dimensionDescriptions } from '../data/riasecQuestions';
import CarrerasRecomendadas from '../components/CarrerasRecomendadas';
import ScheduleButton from '../components/ScheduleButton';

function Resultados() {
  const navigate = useNavigate();
  const [resultado, setResultado] = useState(null);
  const [interpretacion, setInterpretacion] = useState(null);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [explicacionIA, setExplicacionIA] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    // Obtener respuestas del sessionStorage
    const responsesJSON = sessionStorage.getItem('test_responses');
    const duration = sessionStorage.getItem('test_duration');

    if (!responsesJSON) {
      alert('No se encontraron respuestas del test');
      navigate('/test');
      return;
    }

    try {
      const responses = JSON.parse(responsesJSON);

      // 1. Calcular código RIASEC
      const resultadoTest = calcularCodigoRIASEC(responses);
      setResultado(resultadoTest);

      // 2. Generar interpretación
      const interp = generarInterpretacion(resultadoTest);
      setInterpretacion(interp);

      // 3. Obtener recomendaciones de carreras
      const carreras = recomendarCarreras(resultadoTest.codigo_holland, {
        topN: 6
      });
      setRecomendaciones(carreras);

      // 4. Generar explicación IA
      setLoadingIA(true);
      try {
        const explicacion = await generarExplicacionIA(resultadoTest);
        setExplicacionIA(explicacion);
      } catch (err) {
        console.error('Error generando explicación IA:', err);
        setExplicacionIA(
          `Tu perfil ${resultadoTest.codigo_holland} combina las dimensiones ${interp.perfil}. ` +
          `Esto indica que tienes fortalezas en ${interp.fortalezas.join(' y ')}. ` +
          `Las carreras recomendadas se alinean con estas características.`
        );
      } finally {
        setLoadingIA(false);
      }

      // 5. Guardar en Supabase
      setSaving(true);
      try {
        await saveTestResult({
          codigo_holland: resultadoTest.codigo_holland,
          certeza: resultadoTest.certeza,
          puntajes: resultadoTest.puntajes,
          respuestas: responses,
          duracion_minutos: parseInt(duration) || 10,
          explicacion_ia: explicacion || null,
          carreras_recomendadas: carreras.map(c => c.id)
        });
      } catch (err) {
        console.error('Error guardando resultado:', err);
        // No bloqueamos si falla el guardado
      } finally {
        setSaving(false);
      }

    } catch (err) {
      console.error('Error procesando resultados:', err);
      alert('Hubo un error al procesar los resultados');
      navigate('/test');
    }
  };

  if (!resultado || !interpretacion) {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-orienta-blue mx-auto mb-4" />
          <p className="text-white/60">Calculando tu perfil vocacional...</p>
        </div>
      </div>
    );
  }

  const getCertezaColor = (certeza) => {
    if (certeza === 'Alta') return 'text-green-400';
    if (certeza === 'Media') return 'text-yellow-400';
    return 'text-blue-400';
  };

  const top3Dimensions = resultado.ranking_completo.slice(0, 3);

  return (
    <div className="min-h-screen bg-orienta-dark">
      {/* Hero Section - Resultados Principales */}
      <div className="bg-gradient-to-br from-orienta-dark via-orienta-blue/20 to-orienta-dark border-b border-white/10">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-block px-4 py-2 bg-green-400/20 border border-green-400/30 rounded-full mb-4">
              <span className="text-green-400 text-sm font-semibold flex items-center gap-2">
                <Award size={16} />
                Test Completado
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Tu Código Holland es{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orienta-blue to-green-400">
                {resultado.codigo_holland}
              </span>
            </h1>

            <p className="text-xl text-white/80 mb-6">
              {interpretacion.perfil}
            </p>

            <div className="flex items-center justify-center gap-4">
              <div className="px-6 py-3 bg-white/10 rounded-full border border-white/20">
                <span className="text-white/60 text-sm">Nivel de certeza: </span>
                <span className={`font-bold ${getCertezaColor(resultado.certeza)}`}>
                  {resultado.certeza}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Top 3 Dimensions */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {top3Dimensions.map((dim, index) => {
              const desc = dimensionDescriptions[dim.dimension];
              return (
                <motion.div
                  key={dim.dimension}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/20 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-orienta-blue/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-orienta-blue">
                        {dim.dimension}
                      </span>
                    </div>
                    <span className="text-sm text-white/60">#{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{desc.nombre}</h3>
                  <p className="text-sm text-white/70 mb-3">{desc.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Puntaje</span>
                    <span className="text-lg font-bold text-orienta-blue">
                      {dim.puntaje}/30
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explicación IA */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8 mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={24} className="text-purple-400" />
            <h2 className="text-2xl font-bold text-white">
              Análisis Personalizado con IA
            </h2>
          </div>

          {loadingIA ? (
            <div className="flex items-center gap-3 text-white/60">
              <Loader2 size={20} className="animate-spin" />
              <span>Generando análisis personalizado...</span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <p className="text-white/90 leading-relaxed whitespace-pre-line">
                {explicacionIA}
              </p>
            </div>
          )}
        </motion.div>

        {/* Recomendaciones de Carreras */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <CarrerasRecomendadas
            recomendaciones={recomendaciones}
            codigoUsuario={resultado.codigo_holland}
          />
        </motion.div>

        {/* Botón de Agendamiento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <ScheduleButton />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-12"
        >
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Download size={20} />
            Descargar PDF
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Mi perfil vocacional: ${resultado.codigo_holland}`,
                  text: `Descubrí mi vocación con OrientaIA. Mi código Holland es ${resultado.codigo_holland}.`,
                  url: window.location.href
                });
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Share2 size={20} />
            Compartir
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-orienta-blue to-green-400 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Volver al inicio
          </button>
        </motion.div>

        {saving && (
          <p className="text-center text-white/40 text-sm mt-4">
            Guardando resultado...
          </p>
        )}
      </div>
    </div>
  );
}

export default Resultados;
