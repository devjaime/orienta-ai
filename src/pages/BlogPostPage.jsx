import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers3,
  Tag,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";
import { getPostBySlug, getPostsRecientes } from "../data/blogPosts";

const formatFecha = (fechaStr) =>
  new Date(fechaStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });

const audienceLabel = {
  joven: "Jóvenes",
  adulto: "Adultos en reconversión",
  apoderado: "Apoderados",
  mixto: "Jóvenes y adultos",
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(undefined);
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    async function cargar() {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .eq("publicado", true)
          .single();

        if (!error && data) {
          const staticPost = getPostBySlug(slug);
          setPost({ ...staticPost, ...data });
          const { data: rec } = await supabase
            .from("blog_posts")
            .select("slug, titulo, emoji, categoria, resumen, lectura, fecha")
            .eq("publicado", true)
            .neq("slug", slug)
            .order("fecha", { ascending: false })
            .limit(3);
          setRecientes(rec || []);
          return;
        }
      } catch {
        // Fallback abajo.
      }

      const staticPost = getPostBySlug(slug);
      setPost(staticPost);
      if (staticPost) {
        setRecientes(
          getPostsRecientes(4)
            .filter((p) => p.slug !== slug)
            .slice(0, 3)
        );
      }
    }
    cargar();
  }, [slug]);

  if (post === undefined) {
    return (
      <div className="min-h-screen bg-aura-surface">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-aura-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen overflow-hidden bg-aura-surface text-aura-ink">
      <Header />

      <section className="relative px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="aura-orb -left-24 top-12 h-72 w-72 bg-aura-primary/20" />
        <div className="aura-orb right-0 top-24 h-80 w-80 bg-aura-teal/20" />
        <div className="mx-auto max-w-4xl">
          <Motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Link
              to="/blog"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-aura-primary/15 bg-white/70 px-4 py-2 text-sm font-semibold text-aura-primary backdrop-blur-xl hover:border-aura-primary/30"
            >
              <ArrowLeft size={16} />
              Volver al blog
            </Link>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-aura-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-aura-primary">
                <Tag size={13} />
                {post.categoria}
              </span>
              {post.audiencia && (
                <span className="rounded-full bg-aura-teal/10 px-3 py-1 text-xs font-bold text-aura-teal">
                  {audienceLabel[post.audiencia] || post.audiencia}
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] text-aura-ink sm:text-5xl">
              {post.titulo}
            </h1>
            <p className="mt-5 text-lg leading-8 text-aura-muted">{post.resumen}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-aura-muted">
              <span className="inline-flex items-center gap-1">
                <BookOpen size={16} />
                {post.autor}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={16} />
                {formatFecha(post.fecha)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={16} />
                {post.lectura} min de lectura
              </span>
            </div>
          </Motion.div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <Motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-[2rem] border border-aura-primary/10 bg-white p-6 shadow-sm md:p-10"
        >
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-display prose-headings:text-aura-ink
              prose-h2:text-2xl prose-h2:font-bold prose-h2:tracking-[-0.02em]
              prose-p:text-aura-muted prose-p:leading-8
              prose-li:text-aura-muted prose-li:leading-7
              prose-strong:text-aura-ink
              prose-a:text-aura-primary hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.contenido }}
          />

          {post.rutas?.length > 0 && (
            <section className="mt-10 rounded-3xl border border-aura-primary/10 bg-aura-surface p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
                  <Layers3 size={20} />
                </span>
                <h2 className="font-display text-2xl font-bold">Ruta sugerida</h2>
              </div>
              <ol className="space-y-3">
                {post.rutas.map((step, index) => (
                  <li key={step} className="flex gap-3 text-aura-muted">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aura-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="leading-7">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {post.fuentes?.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-2xl font-bold">Fuentes</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {post.fuentes.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start justify-between gap-3 rounded-2xl border border-aura-primary/10 bg-white px-4 py-3 text-sm font-medium text-aura-muted transition hover:border-aura-primary/30 hover:text-aura-primary"
                  >
                    <span>{source.nombre}</span>
                    <ExternalLink size={15} className="mt-0.5 shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </Motion.article>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          {post.roles && (
            <div className="rounded-3xl border border-aura-primary/10 bg-white p-5 shadow-sm">
              <h2 className="font-display text-xl font-bold">Roles relacionados</h2>
              {Object.entries(post.roles).map(([group, roles]) => (
                <div key={group} className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-aura-primary">
                    {group === "tecnologicos" ? "Tecnológicos" : "No tecnológicos"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <span key={role} className="rounded-full bg-aura-primary/5 px-3 py-1.5 text-sm text-aura-muted">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-3xl border border-aura-primary/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-aura-primary">
              <CheckCircle2 size={18} />
              <p className="text-sm font-bold uppercase tracking-[0.16em]">Siguiente paso</p>
            </div>
            <h2 className="mt-3 font-display text-xl font-bold">Convierte lectura en decisión</h2>
            <p className="mt-2 text-sm leading-6 text-aura-muted">
              Usa Vocari para cruzar intereses, datos de carreras y rutas de reconversión.
            </p>
            <Link to="/test" className="aura-button-primary mt-4 w-full !px-4 !py-3">
              Hacer test gratis <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </main>

      {recientes.length > 0 && (
        <section className="border-t border-aura-primary/10 bg-white/70 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-2xl font-bold">Más artículos</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {recientes.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group rounded-3xl border border-aura-primary/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-aura-primary/10"
                >
                  <span className="rounded-full bg-aura-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-aura-primary">
                    {p.categoria}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold leading-tight group-hover:text-aura-primary">
                    {p.titulo}
                  </h3>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aura-primary">
                    Leer <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
