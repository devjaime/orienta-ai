import { useState, useRef } from "react";
import { motion as Motion } from "framer-motion";
import {
  Upload,
  Link2,
  Save,
  Eye,
  EyeOff,
  FileText,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Trash2,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// ── Contraseña simple de acceso al mantenedor ──────────────────────────────
const ADMIN_PASSWORD = import.meta.env.VITE_BLOG_ADMIN_PASSWORD;

// ── Categorías disponibles ─────────────────────────────────────────────────
const CATEGORIAS = [
  "Orientación vocacional",
  "Mercado laboral",
  "Educación",
  "Tecnología",
  "General",
];

const EMOJIS = ["🧭", "📊", "🎓", "💰", "🔎", "📝", "🚀", "💡", "🌟", "🎯"];

// ── Estado inicial del formulario ──────────────────────────────────────────
const FORM_INICIAL = {
  slug: "",
  titulo: "",
  resumen: "",
  categoria: "Orientación vocacional",
  autor: "Equipo Vocari",
  fecha: new Date().toISOString().split("T")[0],
  emoji: "📝",
  lectura: 5,
  contenido: "",
  publicado: false,
};

// ── Utilitario: texto → slug ───────────────────────────────────────────────
function toSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Componente principal ───────────────────────────────────────────────────
export default function BlogAdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState(false);

  const [form, setForm] = useState(FORM_INICIAL);
  const [previewHtml, setPreviewHtml] = useState(false);
  const [importando, setImportando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: "ok"|"error", texto }
  const [posts, setPosts] = useState([]);
  const [cargandoPosts, setCargandoPosts] = useState(false);

  const fileInputRef = useRef(null);

  // ── Login simple ─────────────────────────────────────────────────────────
  function handleLogin(e) {
    e.preventDefault();
    if (passInput === ADMIN_PASSWORD) {
      setAutenticado(true);
      cargarPosts();
    } else {
      setPassError(true);
      setTimeout(() => setPassError(false), 2000);
    }
  }

  // ── Cargar posts existentes ───────────────────────────────────────────────
  async function cargarPosts() {
    setCargandoPosts(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, titulo, publicado, fecha, categoria")
      .order("fecha", { ascending: false });

    if (!error) setPosts(data || []);
    setCargandoPosts(false);
  }

  // ── Cargar post existente para editar ────────────────────────────────────
  async function cargarPost(id) {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (!error && data) {
      setForm({
        ...data,
        fecha: data.fecha?.split("T")[0] ?? data.fecha,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ── Helpers de formulario ─────────────────────────────────────────────────
  function setField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generar slug desde título si aún está vacío o coincide con el anterior
      if (field === "titulo") {
        const slugActual = prev.slug;
        const slugAnterior = toSlug(prev.titulo);
        if (!slugActual || slugActual === slugAnterior) {
          next.slug = toSlug(value);
        }
      }
      return next;
    });
  }

  // ── Importar desde .docx ──────────────────────────────────────────────────
  async function handleDocxUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportando(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setField("contenido", result.value);
      if (result.messages.length > 0) {
        console.warn("Advertencias mammoth:", result.messages);
      }
      setMensaje({ tipo: "ok", texto: `✅ Importado desde "${file.name}"` });
    } catch {
      setMensaje({ tipo: "error", texto: `Error al leer el archivo: ${err.message}` });
    } finally {
      setImportando(false);
      e.target.value = "";
    }
  }

  // ── Importar desde Google Docs (URL pública) ──────────────────────────────
  async function handleGoogleDocsImport() {
    const url = prompt(
      "Pega la URL del Google Doc publicado como HTML:\n\n" +
        "Pasos: Archivo → Publicar en la web → Publicar → copiar enlace HTML"
    );
    if (!url) return;

    // Convertir URL de visualización a URL de exportación si es necesario
    const exportUrl = url.includes("/pub?")
      ? url
      : url.replace(/\/edit.*$/, "/pub?output=html");

    setImportando(true);
    try {
      const resp = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(exportUrl)}`
      );
      if (!resp.ok) throw new Error("No se pudo obtener el documento");
      const json = await resp.json();
      const parser = new DOMParser();
      const doc = parser.parseFromString(json.contents, "text/html");

      // Extraer sólo el cuerpo del documento
      const body = doc.querySelector("#contents") || doc.body;
      const html = body ? body.innerHTML : json.contents;

      setField("contenido", html);
      setMensaje({ tipo: "ok", texto: "✅ Contenido importado desde Google Docs" });
    } catch {
      setMensaje({
        tipo: "error",
        texto:
          "No se pudo importar. Asegúrate de que el documento esté publicado como HTML.",
      });
    } finally {
      setImportando(false);
    }
  }

  // ── Guardar en Supabase ───────────────────────────────────────────────────
  async function handleGuardar() {
    if (!form.slug || !form.titulo || !form.contenido) {
      setMensaje({ tipo: "error", texto: "Slug, título y contenido son obligatorios." });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    const payload = {
      slug: form.slug,
      titulo: form.titulo,
      resumen: form.resumen,
      categoria: form.categoria,
      autor: form.autor,
      fecha: form.fecha,
      emoji: form.emoji,
      lectura: Number(form.lectura),
      contenido: form.contenido,
      publicado: form.publicado,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (form.id) {
      // Actualizar
      ({ error } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", form.id));
    } else {
      // Insertar
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }

    if (error) {
      setMensaje({ tipo: "error", texto: `Error: ${error.message}` });
    } else {
      setMensaje({
        tipo: "ok",
        texto: form.id ? "✅ Artículo actualizado correctamente." : "✅ Artículo publicado correctamente.",
      });
      setForm(FORM_INICIAL);
      cargarPosts();
    }
    setGuardando(false);
  }

  // ── Cambiar estado publicado / borrador ───────────────────────────────────
  async function togglePublicado(id, actual) {
    await supabase.from("blog_posts").update({ publicado: !actual }).eq("id", id);
    cargarPosts();
  }

  // ── Eliminar post ─────────────────────────────────────────────────────────
  async function eliminarPost(id, titulo) {
    if (!window.confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    cargarPosts();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Login
  // ─────────────────────────────────────────────────────────────────────────
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <span className="text-5xl">🔐</span>
            <h1 className="text-xl font-bold text-gray-800 mt-3 font-poppins">
              Blog Admin
            </h1>
            <p className="text-gray-500 text-sm mt-1">Acceso restringido a mantenedores</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  passError
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-vocari-primary/30"
                }`}
                placeholder="••••••••"
                autoFocus
              />
              {passError && (
                <p className="text-red-500 text-xs mt-1">Contraseña incorrecta</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-vocari-primary text-white rounded-lg py-2 font-semibold text-sm hover:bg-vocari-light transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Ingresar
            </button>
          </form>
        </Motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Admin principal
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 font-poppins">
              📝 Mantenedor de Blog
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Crea y edita artículos desde Word, Google Docs o manualmente.
            </p>
          </div>
          <button
            onClick={() => { setForm(FORM_INICIAL); setMensaje(null); }}
            className="inline-flex items-center gap-2 text-sm bg-vocari-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-vocari-light transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo artículo
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Columna izquierda: formulario ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mensaje de estado */}
            {mensaje && (
              <Motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                  mensaje.tipo === "ok"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {mensaje.tipo === "ok" ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {mensaje.texto}
              </Motion.div>
            )}

            {/* Importar contenido */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
                Importar contenido
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Botón Word */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importando}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-600 hover:border-vocari-primary hover:text-vocari-primary transition-colors text-sm font-medium"
                >
                  {importando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Importar desde Word (.docx)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleDocxUpload}
                />

                {/* Botón Google Docs */}
                <button
                  onClick={handleGoogleDocsImport}
                  disabled={importando}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  {importando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Importar desde Google Docs
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Google Docs: Archivo → Publicar en la web → Publicar → copiar URL.
              </p>
            </div>

            {/* Metadatos */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
                Metadatos del artículo
              </h2>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setField("titulo", e.target.value)}
                  placeholder="Ej. Las 10 carreras con mejor empleabilidad en Chile"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vocari-primary/30"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Slug (URL) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">/blog/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setField("slug", toSlug(e.target.value))}
                    placeholder="las-10-carreras-mejor-empleabilidad"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vocari-primary/30 font-mono"
                  />
                </div>
              </div>

              {/* Resumen */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Resumen / descripción
                </label>
                <textarea
                  value={form.resumen}
                  onChange={(e) => setField("resumen", e.target.value)}
                  rows={2}
                  placeholder="Breve descripción que aparece en la tarjeta del blog..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vocari-primary/30 resize-none"
                />
              </div>

              {/* Fila: categoría + autor + fecha + lectura */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Categoría
                  </label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setField("categoria", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vocari-primary/30"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={form.autor}
                    onChange={(e) => setField("autor", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vocari-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setField("fecha", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vocari-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Tiempo de lectura (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.lectura}
                    onChange={(e) => setField("lectura", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vocari-primary/30"
                  />
                </div>
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Emoji representativo
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setField("emoji", e)}
                      className={`text-2xl w-10 h-10 rounded-lg border-2 transition-colors ${
                        form.emoji === e
                          ? "border-vocari-primary bg-vocari-primary/10"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={(e) => setField("emoji", e.target.value)}
                    maxLength={2}
                    className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg text-center text-lg focus:outline-none focus:border-vocari-primary"
                    title="Escribe tu propio emoji"
                  />
                </div>
              </div>

              {/* Toggle publicado */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setField("publicado", !form.publicado)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.publicado ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      form.publicado ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  {form.publicado ? "Publicado (visible en el blog)" : "Borrador (no visible)"}
                </span>
              </div>
            </div>

            {/* Contenido HTML */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Contenido HTML *
                </h2>
                <button
                  onClick={() => setPreviewHtml((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-vocari-primary font-medium hover:underline"
                >
                  {previewHtml ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Editar
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Vista previa
                    </>
                  )}
                </button>
              </div>

              {previewHtml ? (
                <div
                  className="prose prose-sm max-w-none border border-gray-100 rounded-lg p-4 min-h-40 bg-gray-50
                    prose-headings:font-poppins prose-headings:text-gray-800
                    prose-h2:text-lg prose-h2:font-bold
                    prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-ul:text-gray-600 prose-ol:text-gray-600
                    prose-strong:text-gray-800"
                  dangerouslySetInnerHTML={{ __html: form.contenido }}
                />
              ) : (
                <textarea
                  value={form.contenido}
                  onChange={(e) => setField("contenido", e.target.value)}
                  rows={16}
                  placeholder="<h2>Título de sección</h2><p>Contenido del artículo...</p>"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-vocari-primary/30 resize-y"
                />
              )}
              <p className="text-xs text-gray-400 mt-2">
                Caracteres: {form.contenido.length.toLocaleString()}
              </p>
            </div>

            {/* Botón guardar */}
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full flex items-center justify-center gap-2 bg-vocari-primary text-white rounded-xl py-3 font-semibold text-sm hover:bg-vocari-light transition-colors disabled:opacity-60"
            >
              {guardando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {guardando
                ? "Guardando..."
                : form.id
                ? "Actualizar artículo"
                : "Publicar artículo"}
            </button>
          </div>

          {/* ── Columna derecha: lista de posts ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Artículos existentes
                </h2>
                <button
                  onClick={cargarPosts}
                  className="text-gray-400 hover:text-vocari-primary transition-colors"
                  title="Recargar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {cargandoPosts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-vocari-primary" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No hay artículos en la base de datos.
                  <br />
                  <span className="text-xs">
                    Ejecuta el SQL de creación primero.
                  </span>
                </p>
              ) : (
                <ul className="space-y-3">
                  {posts.map((p) => (
                    <li
                      key={p.id}
                      className="border border-gray-100 rounded-xl p-3 hover:border-vocari-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
                            {p.titulo}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                            /blog/{p.slug}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-400">{p.fecha}</span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                p.publicado
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {p.publicado ? "Publicado" : "Borrador"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => cargarPost(p.id)}
                          className="flex-1 text-xs border border-vocari-primary text-vocari-primary rounded-lg py-1 font-medium hover:bg-vocari-primary hover:text-white transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => togglePublicado(p.id, p.publicado)}
                          className="flex-1 text-xs border border-gray-300 text-gray-600 rounded-lg py-1 font-medium hover:bg-gray-100 transition-colors"
                        >
                          {p.publicado ? "Despublicar" : "Publicar"}
                        </button>
                        <button
                          onClick={() => eliminarPost(p.id, p.titulo)}
                          className="text-xs border border-red-200 text-red-500 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Info de ayuda */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700 space-y-2">
              <p className="font-semibold">💡 Consejos</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Importa desde Word: arrastra un .docx</li>
                <li>Google Docs: publica el doc como HTML primero</li>
                <li>Usa la vista previa para verificar el formato</li>
                <li>El slug se genera automáticamente desde el título</li>
                <li>Activa "Publicado" para que aparezca en el blog</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
