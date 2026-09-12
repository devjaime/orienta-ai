-- =====================================================
-- Tabla blog_posts para Vocari
-- Ejecutar en Supabase SQL Editor
-- =====================================================

create table if not exists public.blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  titulo      text not null,
  resumen     text not null default '',
  categoria   text not null default 'General',
  autor       text not null default 'Equipo Vocari',
  fecha       date not null default current_date,
  emoji       text not null default '📝',
  lectura     int  not null default 5,
  contenido   text not null default '',
  publicado   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Índices
create index if not exists blog_posts_slug_idx      on public.blog_posts (slug);
create index if not exists blog_posts_publicado_idx on public.blog_posts (publicado);
create index if not exists blog_posts_fecha_idx     on public.blog_posts (fecha desc);

-- RLS: lectura pública de posts publicados
alter table public.blog_posts enable row level security;

create policy "Lectura publica de posts publicados"
  on public.blog_posts for select
  using (publicado = true);

create policy "Escritura solo para service_role"
  on public.blog_posts for all
  to service_role
  using (true)
  with check (true);

-- Trigger para updated_at
create or replace function public.update_blog_post_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_post_updated_at on public.blog_posts;
create trigger set_blog_post_updated_at
  before update on public.blog_posts
  for each row execute function public.update_blog_post_updated_at();

-- =====================================================
-- Seed: 5 artículos iniciales (publicados)
-- =====================================================
insert into public.blog_posts (slug, titulo, resumen, categoria, autor, fecha, emoji, lectura, contenido, publicado)
values
(
  'que-es-el-test-riasec',
  '¿Qué es el test RIASEC y cómo puede ayudarte a elegir carrera?',
  'El modelo RIASEC es uno de los métodos vocacionales más validados del mundo. Te explicamos cómo funciona y por qué los datos lo respaldan.',
  'Orientación vocacional', 'Equipo Vocari', '2026-03-01', '🧭', 5,
  '<h2>¿Qué es el modelo RIASEC?</h2><p>El modelo RIASEC fue desarrollado por el psicólogo John Holland en la década de 1950 y se ha convertido en el estándar mundial para medir intereses vocacionales. Su nombre es un acrónimo de las seis dimensiones que lo componen:</p><ul><li><strong>R – Realista:</strong> preferencia por actividades prácticas, uso de herramientas y trabajo físico.</li><li><strong>I – Investigador:</strong> inclinación hacia el análisis, la ciencia y la resolución de problemas complejos.</li><li><strong>A – Artístico:</strong> orientación hacia la creatividad, la expresión y los ambientes poco estructurados.</li><li><strong>S – Social:</strong> gusto por ayudar a otros, enseñar y trabajar en equipo.</li><li><strong>E – Emprendedor:</strong> afinidad por el liderazgo, la persuasión y los negocios.</li><li><strong>C – Convencional:</strong> preferencia por la organización, los sistemas y las tareas con procedimientos claros.</li></ul><h2>¿Cómo se interpreta tu código Holland?</h2><p>Al completar el test obtendrás un código de tres letras que representa tus tres dimensiones dominantes, ordenadas de mayor a menor puntaje. Este código se cruza con perfiles de carreras para encontrar las que mejor se alinean con tus intereses.</p><h2>Vocari + RIASEC + datos reales</h2><p>En Vocari combinamos el algoritmo RIASEC con estadísticas oficiales de MINEDUC y SIES: empleabilidad real, rangos salariales y nivel de saturación del mercado.</p>',
  true
),
(
  'carreras-mejor-empleabilidad-chile-2026',
  'Las 10 carreras con mejor empleabilidad en Chile según datos MINEDUC 2026',
  'Analizamos los datos oficiales del Ministerio de Educación para identificar las carreras con mayor tasa de inserción laboral en el país.',
  'Mercado laboral', 'Equipo Vocari', '2026-03-05', '📊', 7,
  '<h2>Metodología</h2><p>Los datos provienen del Sistema de Información de Educación Superior (SIES) del Ministerio de Educación de Chile. La empleabilidad se mide como el porcentaje de titulados que se encuentra trabajando formalmente al primer año después de egresar.</p><h2>Las 10 carreras con mayor empleabilidad</h2><ol><li><strong>Enfermería</strong> – 94%</li><li><strong>Ingeniería en Informática</strong> – 92%</li><li><strong>Kinesiología</strong> – 91%</li><li><strong>Tecnología Médica</strong> – 90%</li><li><strong>Ingeniería Civil Industrial</strong> – 89%</li><li><strong>Contador Auditor</strong> – 88%</li><li><strong>Fonoaudiología</strong> – 87%</li><li><strong>Ingeniería en Prevención de Riesgos</strong> – 86%</li><li><strong>Nutrición y Dietética</strong> – 85%</li><li><strong>Psicología</strong> – 83%</li></ol><h2>El factor saturación</h2><p>Algunas carreras tienen alta empleabilidad pero también alta saturación. Nuestro algoritmo penaliza eso y prioriza carreras donde la demanda supera a la oferta.</p>',
  true
),
(
  'como-interpretar-codigo-holland',
  'Cómo interpretar tu código Holland y sacarle el máximo provecho',
  'Obtuviste tu código RIASEC, ¿y ahora qué? Te enseñamos a leerlo correctamente y a usarlo como brújula para tu decisión vocacional.',
  'Orientación vocacional', 'Equipo Vocari', '2026-03-08', '🔎', 6,
  '<h2>Tu código Holland no es un destino, es un punto de partida</h2><p>El código RIASEC describe tus intereses actuales, no tus habilidades ni tu potencial.</p><h2>Cómo leer las tres letras</h2><ul><li><strong>Primera letra:</strong> dimensión dominante.</li><li><strong>Segunda letra:</strong> dimensión secundaria.</li><li><strong>Tercera letra:</strong> dimensión de apoyo.</li></ul><h2>Casos prácticos</h2><p><strong>SCR:</strong> Enfermería, Trabajo Social, Educación Diferencial.</p><p><strong>IRC:</strong> Ingeniería Civil, Química Industrial, Geología.</p><p><strong>ASE:</strong> Diseño, Comunicaciones, Pedagogía en Artes.</p>',
  true
),
(
  'orientacion-vocacional-temprana-beneficios',
  'Por qué la orientación vocacional temprana reduce la deserción universitaria',
  'Chile tiene una de las tasas de deserción universitaria más altas de LATAM. Los datos muestran que la orientación temprana puede reducirla significativamente.',
  'Educación', 'Equipo Vocari', '2026-03-10', '🎓', 8,
  '<h2>El problema de la deserción universitaria en Chile</h2><p>Aproximadamente el 30% de los estudiantes que ingresan a la educación superior en Chile no termina su carrera. Una de las causas más frecuentes es la elección equivocada de carrera.</p><h2>¿Qué dice la evidencia?</h2><p>Un estudio de la Universidad de Chile (2022) encontró que los estudiantes que recibieron orientación vocacional formal tenían un 40% menos de probabilidad de desertar en los primeros dos años.</p><h2>El rol de la tecnología</h2><p>Herramientas como Vocari permiten democratizar la orientación vocacional, accesible para cualquier estudiante con internet.</p>',
  true
),
(
  'salarios-carreras-chile-2026',
  'Salarios por carrera en Chile 2026: lo que los datos realmente dicen',
  'Analizamos rangos salariales reales de egresados chilenos con datos oficiales SIES. Sin mitos, sin promedios engañosos.',
  'Mercado laboral', 'Equipo Vocari', '2026-03-12', '💰', 6,
  '<h2>¿Por qué los salarios publicados suelen ser engañosos?</h2><p>Muchas fuentes reportan el "salario promedio" de una carrera incluyendo a profesionales con 20+ años de experiencia. En Vocari usamos los datos del SIES segmentados por años de experiencia.</p><h2>Rangos salariales al primer año de egreso</h2><ul><li><strong>Medicina:</strong> $1.800.000 – $2.400.000 CLP/mes</li><li><strong>Ingeniería en Informática:</strong> $1.200.000 – $1.800.000 CLP/mes</li><li><strong>Derecho:</strong> $700.000 – $1.200.000 CLP/mes</li><li><strong>Psicología:</strong> $600.000 – $900.000 CLP/mes</li></ul>',
  true
)
on conflict (slug) do nothing;

select 'Blog table created and seeded ✓' as status;
