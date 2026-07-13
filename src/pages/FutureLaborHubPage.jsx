import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  GraduationCap,
  Map,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  futureLaborFeaturedSlugs,
  futureLaborRoleGroups,
  futureLaborRoutes,
  futureLaborScenarios,
  futureLaborStats,
  sourceLibrary,
} from "../data/futureLabor2030";
import { getPostBySlug } from "../data/blogPosts";
import { SITE_LINKS } from "../lib/siteLinks";

const sources = [
  sourceLibrary.wef,
  sourceLibrary.ilo,
  sourceLibrary.oecd,
  sourceLibrary.mifuturo,
  sourceLibrary.observatorio,
  sourceLibrary.mctp,
  sourceLibrary.chilevalora,
];

const featuredPosts = futureLaborFeaturedSlugs
  .map((slug) => getPostBySlug(slug))
  .filter(Boolean);

export default function FutureLaborHubPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-aura-surface text-aura-ink">
      <Header />
      <section className="relative px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="aura-orb -left-24 top-10 h-72 w-72 bg-aura-primary/20" />
        <div className="aura-orb right-0 top-28 h-80 w-80 bg-aura-teal/20" />
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <Motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <Link
                to="/blog"
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-aura-primary/15 bg-white/70 px-4 py-2 text-sm font-semibold text-aura-primary backdrop-blur-xl hover:border-aura-primary/30"
              >
                <BookOpen size={16} />
                Blog Vocari
              </Link>
              <p className="aura-kicker">Futuro laboral 2030</p>
              <h1 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.04em] text-aura-ink sm:text-5xl lg:text-6xl">
                Rutas educativas para un trabajo que ya está cambiando
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-aura-muted">
                Un mapa editorial para entender escenarios 2030, separar señales de ruido y
                elegir rutas de estudio o reconversión con datos globales y contexto chileno.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={SITE_LINKS.vocationalTest} className="aura-button-primary">
                  Diagnosticar mi perfil <ArrowRight size={18} />
                </Link>
                <a
                  href={SITE_LINKS.careerTransition}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aura-button-secondary"
                >
                  Ver reconversión profesional <Route size={18} />
                </a>
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="aura-glass p-5 md:p-7"
            >
              <div className="rounded-3xl bg-gradient-to-br from-aura-ink to-aura-primary p-5 text-white shadow-2xl shadow-aura-primary/20">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                      Señales verificables
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold">Escenario 2030</h2>
                  </div>
                  <Sparkles className="text-aura-teal" size={28} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {futureLaborStats.map((stat) => (
                    <div key={stat.value} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="font-display text-3xl font-extrabold">{stat.value}</p>
                      <p className="mt-2 text-sm leading-5 text-white/75">{stat.label}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-aura-teal">
                        {stat.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Motion.div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {futureLaborScenarios.map((scenario, index) => (
            <Motion.article
              key={scenario.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="aura-glass p-5"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
                {index === 0 ? <BrainCircuit /> : index === 1 ? <BarChart3 /> : index === 2 ? <ShieldCheck /> : <Map />}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-aura-primary">{scenario.tag}</p>
              <h2 className="mt-2 font-display text-xl font-bold text-aura-ink">{scenario.title}</h2>
              <p className="mt-3 text-sm leading-6 text-aura-muted">{scenario.text}</p>
            </Motion.article>
          ))}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="aura-glass p-6 md:p-8">
            <p className="aura-kicker">Roles con proyección</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em]">
              Tecnología y trabajo humano, no una cosa contra la otra
            </h2>
            <p className="mt-4 leading-7 text-aura-muted">
              La interfaz separa roles tecnológicos y no tecnológicos porque el futuro no será
              homogéneo: muchos trabajos crecerán por combinar operación real, criterio humano y
              herramientas digitales.
            </p>
            <a
              href={SITE_LINKS.skillGraph}
              target="_blank"
              rel="noopener noreferrer"
              className="aura-button-primary mt-6"
            >
              Explorar ruta hacia IA <ArrowRight size={18} />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {futureLaborRoleGroups.map((group) => (
              <div key={group.title} className="rounded-3xl border border-aura-primary/10 bg-white/80 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-aura-teal/10 text-aura-teal">
                    <BriefcaseBusiness size={20} />
                  </span>
                  <h3 className="font-display text-xl font-bold">{group.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.roles.map((role) => (
                    <span key={role} className="rounded-full bg-aura-primary/5 px-3 py-1.5 text-sm font-medium text-aura-muted">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          {futureLaborRoutes.map((route) => (
            <article key={route.title} className="rounded-3xl border border-aura-primary/10 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aura-violet/10 text-aura-violet">
                  <GraduationCap size={22} />
                </span>
                <h2 className="font-display text-2xl font-bold">{route.title}</h2>
              </div>
              <ol className="space-y-3">
                {route.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-aura-muted">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aura-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="leading-7">{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </section>

        <section className="mt-14">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="aura-kicker">Lecturas guiadas</p>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em]">
                Artículos para navegar la decisión
              </h2>
            </div>
            <Link to="/blog" className="aura-button-secondary w-fit">
              Ver todo el blog <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group rounded-3xl border border-aura-primary/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-aura-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-aura-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-aura-teal">
                    {post.categoria}
                  </span>
                  <span className="text-xs font-semibold text-aura-muted">{post.lectura} min</span>
                </div>
                <h3 className="font-display text-xl font-bold leading-tight text-aura-ink group-hover:text-aura-primary">
                  {post.titulo}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-aura-muted">{post.resumen}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-aura-primary/10 bg-white/70 p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-aura-primary">Fuentes usadas</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Datos trazables, lectura simple</h2>
              <p className="mt-3 max-w-2xl leading-7 text-aura-muted">
                Las cifras globales se usan como escenarios, no como promesas. Para Chile se priorizan
                fuentes públicas sobre carreras, demanda laboral y rutas técnico profesionales.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:max-w-2xl">
              {sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-aura-primary/10 bg-white px-4 py-3 text-sm font-medium text-aura-muted transition hover:border-aura-primary/30 hover:text-aura-primary"
                >
                  {source.nombre}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
