import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Calendar, Clock, Tag, ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import { blogPosts as blogPostsStatic } from "../data/blogPosts";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

const formatFecha = (fechaStr) =>
  new Date(fechaStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });

export default function BlogPage() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [posts, setPosts] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ── Cargar posts desde Supabase (con fallback estático) ──────────────────
  useEffect(() => {
    async function cargar() {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("slug, titulo, resumen, categoria, autor, fecha, emoji, lectura, publicado")
          .eq("publicado", true)
          .order("fecha", { ascending: false });

        if (error || !data || data.length === 0) {
          // Fallback a datos estáticos si Supabase no está listo
          setPosts(blogPostsStatic);
        } else {
          setPosts(data);
        }
      } catch {
        setPosts(blogPostsStatic);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // ── Filtrar por categoría ─────────────────────────────────────────────────
  const categorias = ["Todas", ...new Set(posts.map((p) => p.categoria))];

  const postsFiltrados =
    categoriaActiva === "Todas"
      ? posts
      : posts.filter((p) => p.categoria === categoriaActiva);

  const [destacado, ...resto] = postsFiltrados;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero del blog */}
      <section className="bg-gradient-to-br from-vocari-primary via-vocari-light to-vocari-primary pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 text-white rounded-full px-4 py-2 text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              Blog Vocari
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 font-poppins">
              Orientación vocacional con datos reales
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Artículos sobre orientación vocacional, mercado laboral chileno y
              cómo tomar mejores decisiones educativas.
            </p>
          </Motion.div>
        </div>
      </section>

      {/* Filtros por categoría */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoriaActiva === cat
                  ? "bg-vocari-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {cargando ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-vocari-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : postsFiltrados.length === 0 ? (
          <p className="text-center text-gray-500 py-16">
            No hay artículos en esta categoría aún.
          </p>
        ) : (
          <>
            {/* Post destacado */}
            {destacado && (
              <Motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="mb-12"
              >
                <Link
                  to={`/blog/${destacado.slug}`}
                  className="group block rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="grid md:grid-cols-2">
                    {/* Imagen / emoji placeholder */}
                    <div className="bg-gradient-to-br from-vocari-primary/10 to-vocari-accent/10 flex items-center justify-center min-h-48 md:min-h-64">
                      <span className="text-8xl select-none">{destacado.emoji}</span>
                    </div>
                    {/* Contenido */}
                    <div className="p-8 flex flex-col justify-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-vocari-accent mb-3 uppercase tracking-wide">
                        <Tag className="w-3 h-3" />
                        {destacado.categoria}
                      </span>
                      <h2 className="text-2xl font-bold text-vocari-dark mb-3 group-hover:text-vocari-primary transition-colors font-poppins">
                        {destacado.titulo}
                      </h2>
                      <p className="text-gray-500 mb-4 leading-relaxed">
                        {destacado.resumen}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatFecha(destacado.fecha)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {destacado.lectura} min de lectura
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-vocari-primary group-hover:gap-2 transition-all">
                        Leer artículo <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Motion.div>
            )}

            {/* Grid de posts restantes */}
            {resto.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resto.map((post, i) => (
                  <Motion.div
                    key={post.slug}
                    initial="hidden"
                    animate="visible"
                    custom={i + 1}
                    variants={fadeIn}
                  >
                    <Link
                      to={`/blog/${post.slug}`}
                      className="group flex flex-col h-full rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Emoji banner */}
                      <div className="bg-gradient-to-br from-vocari-primary/5 to-vocari-accent/5 flex items-center justify-center h-36">
                        <span className="text-6xl select-none">{post.emoji}</span>
                      </div>
                      {/* Info */}
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-xs font-semibold text-vocari-accent uppercase tracking-wide mb-2">
                          {post.categoria}
                        </span>
                        <h3 className="font-bold text-vocari-dark mb-2 group-hover:text-vocari-primary transition-colors leading-snug font-poppins">
                          {post.titulo}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 flex-1 leading-relaxed line-clamp-3">
                          {post.resumen}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatFecha(post.fecha)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.lectura} min
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA inferior */}
      <section className="bg-vocari-primary/5 border-t border-vocari-primary/10 py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-vocari-dark mb-2 font-poppins">
          ¿Listo para descubrir tu perfil vocacional?
        </h2>
        <p className="text-gray-500 mb-5 max-w-md mx-auto">
          Haz el test RIASEC gratis y recibe recomendaciones de carrera basadas
          en datos reales del mercado laboral chileno.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-vocari-primary text-white font-semibold px-6 py-3 rounded-full hover:bg-vocari-light transition-colors"
        >
          Hacer el test gratis <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
