import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Calendar, Clock, Tag, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getPostBySlug, getPostsRecientes } from "../data/blogPosts";

const formatFecha = (fechaStr) =>
  new Date(fechaStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(undefined); // undefined = cargando, null = no encontrado
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    async function cargar() {
      // 1. Intentar Supabase
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("publicado", true)
        .single();

      if (!error && data) {
        setPost(data);

        // Cargar recientes desde Supabase
        const { data: rec } = await supabase
          .from("blog_posts")
          .select("slug, titulo, emoji, categoria")
          .eq("publicado", true)
          .neq("slug", slug)
          .order("fecha", { ascending: false })
          .limit(3);
        setRecientes(rec || []);
      } else {
        // 2. Fallback a datos estáticos
        const staticPost = getPostBySlug(slug);
        setPost(staticPost); // puede ser null si no existe
        if (staticPost) {
          setRecientes(
            getPostsRecientes(4)
              .filter((p) => p.slug !== slug)
              .slice(0, 3)
          );
        }
      }
    }
    cargar();
  }, [slug]);

  // Cargando
  if (post === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-vocari-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No encontrado → redirigir al listado
  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero del artículo */}
      <section className="bg-gradient-to-br from-vocari-primary via-vocari-light to-vocari-primary pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al blog
            </Link>

            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1 bg-white/10 text-white rounded-full px-3 py-1 text-xs font-medium">
                <Tag className="w-3 h-3" />
                {post.categoria}
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 font-poppins leading-tight">
              {post.titulo}
            </h1>

            <p className="text-white/80 text-base mb-6 leading-relaxed">
              {post.resumen}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {post.autor}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatFecha(post.fecha)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.lectura} min de lectura
              </span>
            </div>
          </Motion.div>
        </div>
      </section>

      {/* Emoji banner */}
      <div className="bg-vocari-primary/5 border-b border-vocari-primary/10 py-8 text-center">
        <span className="text-7xl select-none">{post.emoji}</span>
      </div>

      {/* Contenido del artículo */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="prose prose-lg max-w-none
            prose-headings:font-poppins prose-headings:text-vocari-dark
            prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-ul:text-gray-600 prose-ol:text-gray-600
            prose-li:mb-1
            prose-strong:text-vocari-dark
            prose-a:text-vocari-primary hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.contenido }}
        />

        {/* Separador */}
        <hr className="my-10 border-gray-100" />

        {/* CTA de conversión */}
        <div className="rounded-2xl bg-vocari-primary/5 border border-vocari-primary/15 p-8 text-center">
          <span className="text-4xl mb-3 block">🧭</span>
          <h3 className="text-xl font-bold text-vocari-dark mb-2 font-poppins">
            ¿Quieres saber cuál es tu perfil vocacional?
          </h3>
          <p className="text-gray-500 mb-5 max-w-sm mx-auto">
            Haz el test RIASEC gratis en 5 minutos y recibe recomendaciones de
            carrera basadas en datos oficiales de Chile.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-vocari-primary text-white font-semibold px-6 py-3 rounded-full hover:bg-vocari-light transition-colors"
          >
            Hacer el test gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Artículos relacionados */}
      {recientes.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-vocari-dark mb-6 font-poppins">
              Más artículos del blog
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recientes.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-vocari-primary/5 flex items-center justify-center h-28">
                    <span className="text-5xl select-none">{p.emoji}</span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <span className="text-xs font-semibold text-vocari-accent uppercase tracking-wide mb-1">
                      {p.categoria}
                    </span>
                    <h3 className="font-semibold text-vocari-dark text-sm group-hover:text-vocari-primary transition-colors leading-snug font-poppins line-clamp-2 mb-2">
                      {p.titulo}
                    </h3>
                    <span className="mt-auto text-xs text-vocari-primary font-medium inline-flex items-center gap-1">
                      Leer <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
