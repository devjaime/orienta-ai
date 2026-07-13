import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowRight, BookOpen, Calendar, Clock, Compass, Database, Filter, Tag } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";
import { blogPosts as blogPostsStatic } from "../data/blogPosts";
import { futureLaborStats } from "../data/futureLabor2030";

const CATEGORY_ORDER = [
  "Todas",
  "Futuro laboral 2030",
  "Reconversión",
  "Tecnología",
  "Salud y cuidados",
  "Educación",
  "Oficios y TP",
  "Mercado laboral",
  "Orientación vocacional",
];

const formatFecha = (fechaStr) =>
  new Date(fechaStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });

const mergePosts = (remotePosts = []) => {
  const bySlug = new Map(blogPostsStatic.map((post) => [post.slug, post]));
  remotePosts.forEach((post) => {
    if (post?.slug) bySlug.set(post.slug, { ...bySlug.get(post.slug), ...post });
  });
  return [...bySlug.values()].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

const audienceLabel = {
  joven: "Jóvenes",
  adulto: "Adultos",
  apoderado: "Apoderados",
  mixto: "Mixto",
};

export default function BlogPage() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [posts, setPosts] = useState(blogPostsStatic);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("publicado", true)
          .order("fecha", { ascending: false });

        setPosts(error ? blogPostsStatic : mergePosts(data || []));
      } catch {
        setPosts(blogPostsStatic);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const categorias = useMemo(() => {
    const existing = new Set(posts.map((p) => p.categoria).filter(Boolean));
    const ordered = CATEGORY_ORDER.filter((cat) => cat === "Todas" || existing.has(cat));
    const extras = [...existing].filter((cat) => !CATEGORY_ORDER.includes(cat)).sort();
    return [...ordered, ...extras];
  }, [posts]);

  const postsFiltrados =
    categoriaActiva === "Todas"
      ? posts
      : posts.filter((p) => p.categoria === categoriaActiva);

  const [destacado, ...resto] = postsFiltrados;

  return (
    <div className="min-h-screen overflow-x-hidden bg-aura-surface text-aura-ink">
      <Header />

      <section className="relative px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="aura-orb -left-24 top-12 h-72 w-72 bg-aura-primary/20" />
        <div className="aura-orb right-0 top-24 h-80 w-80 bg-aura-teal/20" />
        <div className="mx-auto max-w-7xl">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center"
          >
            <div>
              <p className="aura-kicker">Blog Vocari</p>
              <h1 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.04em] text-aura-ink sm:text-5xl lg:text-6xl">
                Futuro laboral, orientación y reconversión con datos
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-aura-muted">
                Lecturas simples para elegir carrera, planificar reconversión y entender qué
                habilidades podrían sostener empleabilidad hacia 2030.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/blog/futuro-laboral-2030" className="aura-button-primary">
                  Explorar Futuro Laboral 2030 <ArrowRight size={18} />
                </Link>
                <Link to="/test" className="aura-button-secondary">
                  Hacer test vocacional <Compass size={18} />
                </Link>
              </div>
            </div>

            <Link
              to="/blog/futuro-laboral-2030"
              className="aura-glass group block p-5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-aura-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20"
            >
              <div className="rounded-3xl bg-gradient-to-br from-aura-ink to-aura-primary p-5 text-white">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                      Especial editorial
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold">Trabajo 2030</h2>
                  </div>
                  <Database className="text-aura-teal" size={28} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {futureLaborStats.map((stat) => (
                    <div key={stat.value} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="font-display text-2xl font-extrabold">{stat.value}</p>
                      <p className="mt-2 text-xs leading-5 text-white/75">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-aura-teal">
                  Ver escenarios y rutas <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          </Motion.div>
        </div>
      </section>

      <div className="sticky top-[4.5rem] z-30 border-y border-aura-primary/10 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          <span className="hidden items-center gap-2 rounded-full px-2 text-sm font-semibold text-aura-muted md:inline-flex">
            <Filter size={16} />
            Filtros
          </span>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20 ${
                categoriaActiva === cat
                  ? "bg-aura-primary text-white shadow-lg shadow-aura-primary/20"
                  : "bg-aura-primary/5 text-aura-muted hover:bg-aura-primary/10 hover:text-aura-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {cargando ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 rounded-full border-4 border-aura-primary border-t-transparent animate-spin" />
          </div>
        ) : postsFiltrados.length === 0 ? (
          <p className="rounded-3xl bg-white p-10 text-center text-aura-muted">
            No hay artículos en esta categoría aún.
          </p>
        ) : (
          <>
            {destacado && (
              <Link
                to={`/blog/${destacado.slug}`}
                className="group mb-10 grid overflow-hidden rounded-[2rem] border border-aura-primary/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-aura-primary/10 md:grid-cols-[0.9fr_1.1fr]"
              >
                <div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-aura-primary/10 via-aura-violet/10 to-aura-teal/10 p-8">
                  <span className="rounded-3xl bg-white/70 px-6 py-4 font-display text-4xl font-extrabold text-aura-primary shadow-sm">
                    {destacado.emoji}
                  </span>
                </div>
                <article className="p-6 md:p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-aura-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-aura-primary">
                      <Tag size={13} />
                      {destacado.categoria}
                    </span>
                    {destacado.audiencia && (
                      <span className="rounded-full bg-aura-teal/10 px-3 py-1 text-xs font-bold text-aura-teal">
                        {audienceLabel[destacado.audiencia] || destacado.audiencia}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-3xl font-bold tracking-[-0.03em] group-hover:text-aura-primary">
                    {destacado.titulo}
                  </h2>
                  <p className="mt-4 leading-7 text-aura-muted">{destacado.resumen}</p>
                  <PostMeta post={destacado} />
                  <span className="mt-5 inline-flex items-center gap-2 font-semibold text-aura-primary">
                    Leer artículo <ArrowRight size={17} />
                  </span>
                </article>
              </Link>
            )}

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {resto.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-aura-primary/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-aura-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-aura-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-aura-primary">
                      {post.categoria}
                    </span>
                    <span className="rounded-2xl bg-aura-surface-low px-3 py-1 font-display text-sm font-bold text-aura-primary">
                      {post.emoji}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold leading-tight text-aura-ink group-hover:text-aura-primary">
                    {post.titulo}
                  </h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-aura-muted">{post.resumen}</p>
                  <PostMeta post={post} compact />
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <section className="border-t border-aura-primary/10 bg-white/70 px-4 py-14 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-aura-ink">
          ¿Quieres convertir lectura en decisión?
        </h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-aura-muted">
          Haz el test o explora una ruta de reconversión para conectar intereses, datos y próximos pasos.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/test" className="aura-button-primary">
            Test vocacional <ArrowRight size={18} />
          </Link>
          <a href="https://app.vocari.cl/reconversion-gratis" target="_blank" rel="noopener noreferrer" className="aura-button-secondary">
            Reconversión profesional <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PostMeta({ post, compact = false }) {
  const source = post.fuentes?.[0];

  return (
    <div className={`mt-4 flex flex-wrap items-center gap-3 text-xs text-aura-muted ${compact ? "" : "md:text-sm"}`}>
      <span className="inline-flex items-center gap-1">
        <Calendar size={14} />
        {formatFecha(post.fecha)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock size={14} />
        {post.lectura} min
      </span>
      {post.audiencia && compact && (
        <span className="inline-flex items-center gap-1">
          <BookOpen size={14} />
          {audienceLabel[post.audiencia] || post.audiencia}
        </span>
      )}
      {source && (
        <span className="inline-flex items-center gap-1">
          Fuente: {source.nombre.replace("World Economic Forum - ", "").replace(" / MINEDUC - empleabilidad e ingresos", "")}
        </span>
      )}
    </div>
  );
}
