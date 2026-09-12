-- Vocari · Vocational Knowledge Graph MVP
-- PostgreSQL sigue siendo la fuente de verdad. Las relaciones inferidas por IA
-- deben pasar por vocational_candidate_relationships antes de publicarse.

create extension if not exists pgcrypto;

create or replace function public.vocational_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.vocational_is_graph_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_role text;
begin
  resolved_role := coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role'
  );

  if resolved_role in ('admin', 'super_admin', 'orientador') then
    return true;
  end if;

  if to_regclass('public.user_profiles') is null or auth.uid() is null then
    return false;
  end if;

  execute 'select role from public.user_profiles where user_id = $1 limit 1'
    into resolved_role
    using auth.uid();

  return resolved_role in ('admin', 'super_admin', 'orientador');
exception
  when others then
    return false;
end;
$$;

revoke all on function public.vocational_is_graph_admin() from public;
grant execute on function public.vocational_is_graph_admin() to authenticated;

create table if not exists public.vocational_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null check (source_type in (
    'public_dataset', 'official', 'research', 'editorial', 'user_research', 'ai_inference'
  )),
  url text,
  license text,
  version text,
  retrieved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create table if not exists public.vocational_families (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_i18n jsonb not null check (
    jsonb_typeof(name_i18n) = 'object' and name_i18n ? 'es' and name_i18n ? 'en'
  ),
  description_i18n jsonb not null default '{}'::jsonb check (jsonb_typeof(description_i18n) = 'object'),
  color text,
  icon text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  canonical_name text not null unique,
  name_i18n jsonb not null check (
    jsonb_typeof(name_i18n) = 'object' and name_i18n ? 'es' and name_i18n ? 'en'
  ),
  aliases jsonb not null default '{"es": [], "en": []}'::jsonb check (jsonb_typeof(aliases) = 'object'),
  description_i18n jsonb not null default '{}'::jsonb check (jsonb_typeof(description_i18n) = 'object'),
  riasec_codes text[] not null default '{}'::text[],
  career_stage text not null default 'cross_stage' check (career_stage in (
    'entry', 'mid', 'senior', 'leadership', 'cross_stage', 'emerging'
  )),
  entry_difficulty numeric(4,3) check (entry_difficulty between 0 and 1),
  market_demand numeric(4,3) check (market_demand between 0 and 1),
  automation_exposure numeric(4,3) check (automation_exposure between 0 and 1),
  data_status text not null default 'draft' check (data_status in (
    'draft', 'inferred', 'verified', 'human_validated', 'deprecated'
  )),
  source_id uuid references public.vocational_sources(id) on delete set null,
  confidence numeric(4,3) not null default 0.500 check (confidence between 0 and 1),
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  version integer not null default 1 check (version > 0),
  is_published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_published or data_status in ('verified', 'human_validated')),
  check (validated_at is null or validated_by is not null)
);

create table if not exists public.vocational_concepts (
  id uuid primary key default gen_random_uuid(),
  concept_type text not null check (concept_type in (
    'skill', 'interest', 'activity', 'industry', 'education_path',
    'knowledge_area', 'tool', 'work_environment', 'subject'
  )),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  canonical_name text not null,
  name_i18n jsonb not null check (
    jsonb_typeof(name_i18n) = 'object' and name_i18n ? 'es' and name_i18n ? 'en'
  ),
  description_i18n jsonb not null default '{}'::jsonb check (jsonb_typeof(description_i18n) = 'object'),
  aliases jsonb not null default '{"es": [], "en": []}'::jsonb check (jsonb_typeof(aliases) = 'object'),
  parent_id uuid references public.vocational_concepts(id) on delete set null,
  source_id uuid references public.vocational_sources(id) on delete set null,
  data_status text not null default 'draft' check (data_status in (
    'draft', 'inferred', 'verified', 'human_validated', 'deprecated'
  )),
  confidence numeric(4,3) not null default 0.500 check (confidence between 0 and 1),
  is_published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_type, slug),
  check (not is_published or data_status in ('verified', 'human_validated')),
  check (parent_id is null or parent_id <> id)
);

create table if not exists public.vocation_family_memberships (
  vocation_id uuid not null references public.vocations(id) on delete cascade,
  family_id uuid not null references public.vocational_families(id) on delete cascade,
  membership_weight numeric(4,3) not null default 1 check (membership_weight between 0 and 1),
  is_primary boolean not null default false,
  source_id uuid references public.vocational_sources(id) on delete set null,
  confidence numeric(4,3) not null default 0.500 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  primary key (vocation_id, family_id)
);

create table if not exists public.vocation_concept_links (
  id uuid primary key default gen_random_uuid(),
  vocation_id uuid not null references public.vocations(id) on delete cascade,
  concept_id uuid not null references public.vocational_concepts(id) on delete cascade,
  relationship_type text not null check (relationship_type in (
    'REQUIRES_SKILL', 'USES_SKILL', 'MATCHES_INTEREST', 'PERFORMS_ACTIVITY',
    'BELONGS_TO_INDUSTRY', 'STUDIED_VIA', 'USES_TOOL', 'USES_KNOWLEDGE',
    'WORKS_IN_ENVIRONMENT', 'MATCHES_SUBJECT'
  )),
  relevance numeric(4,3) not null default 0.500 check (relevance between 0 and 1),
  proficiency_level smallint check (proficiency_level between 1 and 5),
  is_required boolean not null default false,
  source_id uuid references public.vocational_sources(id) on delete set null,
  data_status text not null default 'draft' check (data_status in (
    'draft', 'inferred', 'verified', 'human_validated', 'deprecated'
  )),
  confidence numeric(4,3) not null default 0.500 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vocation_id, concept_id, relationship_type)
);

create table if not exists public.vocation_relationships (
  id uuid primary key default gen_random_uuid(),
  source_vocation_id uuid not null references public.vocations(id) on delete cascade,
  target_vocation_id uuid not null references public.vocations(id) on delete cascade,
  relationship_type text not null check (relationship_type in (
    'SIMILAR_TO', 'CAN_TRANSITION_TO', 'SPECIALIZES_IN', 'GENERALIZES_TO',
    'ALTERNATIVE_TO', 'EMERGING_FROM'
  )),
  similarity_dimensions jsonb not null default '{}'::jsonb check (jsonb_typeof(similarity_dimensions) = 'object'),
  transition_dimensions jsonb not null default '{}'::jsonb check (jsonb_typeof(transition_dimensions) = 'object'),
  vocational_similarity_score numeric(4,3) check (vocational_similarity_score between 0 and 1),
  career_transition_score numeric(4,3) check (career_transition_score between 0 and 1),
  estimated_difficulty text check (estimated_difficulty in ('low', 'medium', 'high', 'very_high')),
  estimated_duration_months int4range,
  credential_requirements jsonb not null default '[]'::jsonb check (jsonb_typeof(credential_requirements) = 'array'),
  recommended_learning jsonb not null default '[]'::jsonb check (jsonb_typeof(recommended_learning) = 'array'),
  explanation_i18n jsonb not null default '{}'::jsonb check (jsonb_typeof(explanation_i18n) = 'object'),
  source_id uuid references public.vocational_sources(id) on delete set null,
  data_status text not null default 'draft' check (data_status in (
    'draft', 'inferred', 'verified', 'human_validated', 'deprecated'
  )),
  confidence numeric(4,3) not null default 0.500 check (confidence between 0 and 1),
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_vocation_id, target_vocation_id, relationship_type),
  check (source_vocation_id <> target_vocation_id),
  check (validated_at is null or validated_by is not null)
);

create table if not exists public.vocation_relationship_evidence (
  relationship_id uuid not null references public.vocation_relationships(id) on delete cascade,
  concept_id uuid not null references public.vocational_concepts(id) on delete cascade,
  evidence_type text not null check (evidence_type in (
    'shared_skill', 'missing_skill', 'shared_interest', 'shared_activity',
    'shared_knowledge', 'shared_industry', 'shared_environment', 'learning_target'
  )),
  weight numeric(4,3) not null default 0.500 check (weight between 0 and 1),
  source_id uuid references public.vocational_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (relationship_id, concept_id, evidence_type)
);

create table if not exists public.vocational_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'es-CL' check (locale in ('es-CL', 'es', 'en-US', 'en')),
  riasec_code text check (riasec_code is null or riasec_code ~ '^[RIASEC]{1,3}$'),
  exploration_mode text not null default 'first_vocation' check (exploration_mode in (
    'first_vocation', 'career_change', 'upskilling', 'return_to_work'
  )),
  academic_preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(academic_preferences) = 'object'),
  constraints jsonb not null default '{}'::jsonb check (jsonb_typeof(constraints) = 'object'),
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocational_profile_signals (
  user_id uuid not null references public.vocational_profiles(user_id) on delete cascade,
  concept_id uuid not null references public.vocational_concepts(id) on delete cascade,
  signal_type text not null check (signal_type in (
    'interest', 'existing_skill', 'preferred_activity', 'preferred_environment',
    'academic_preference', 'liked_subject', 'disliked_subject', 'industry_interest'
  )),
  strength numeric(4,3) not null check (strength between 0 and 1),
  confidence numeric(4,3) not null default 1 check (confidence between 0 and 1),
  source_type text not null default 'self_reported' check (source_type in (
    'self_reported', 'assessment', 'observed', 'imported', 'inferred'
  )),
  captured_at timestamptz not null default now(),
  primary key (user_id, concept_id, signal_type)
);

create table if not exists public.vocational_recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.vocational_profiles(user_id) on delete cascade,
  algorithm_version text not null,
  profile_snapshot jsonb not null check (jsonb_typeof(profile_snapshot) = 'object'),
  filters jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists public.vocational_recommendation_items (
  run_id uuid not null references public.vocational_recommendation_runs(id) on delete cascade,
  vocation_id uuid not null references public.vocations(id) on delete cascade,
  rank smallint not null check (rank > 0),
  total_score numeric(4,3) not null check (total_score between 0 and 1),
  score_dimensions jsonb not null check (jsonb_typeof(score_dimensions) = 'object'),
  explanation_i18n jsonb not null default '{}'::jsonb check (jsonb_typeof(explanation_i18n) = 'object'),
  created_at timestamptz not null default now(),
  primary key (run_id, vocation_id),
  unique (run_id, rank)
);

create table if not exists public.vocational_recommendation_evidence (
  run_id uuid not null,
  vocation_id uuid not null,
  concept_id uuid not null references public.vocational_concepts(id) on delete cascade,
  contribution numeric(6,5) not null,
  evidence_type text not null,
  created_at timestamptz not null default now(),
  primary key (run_id, vocation_id, concept_id, evidence_type),
  foreign key (run_id, vocation_id)
    references public.vocational_recommendation_items(run_id, vocation_id)
    on delete cascade
);

create table if not exists public.vocational_candidate_relationships (
  id uuid primary key default gen_random_uuid(),
  source_vocation_id uuid not null references public.vocations(id) on delete cascade,
  target_vocation_id uuid not null references public.vocations(id) on delete cascade,
  proposed_relationship_type text not null,
  proposed_dimensions jsonb not null default '{}'::jsonb check (jsonb_typeof(proposed_dimensions) = 'object'),
  proposed_explanation_i18n jsonb not null default '{}'::jsonb check (jsonb_typeof(proposed_explanation_i18n) = 'object'),
  proposal_method text not null check (proposal_method in (
    'embedding', 'llm', 'rule', 'editorial', 'dataset_import'
  )),
  model_name text,
  model_version text,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  source_id uuid references public.vocational_sources(id) on delete set null,
  proposed_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_vocation_id <> target_vocation_id),
  check ((status = 'pending' and reviewed_at is null) or (status <> 'pending' and reviewed_at is not null))
);

create table if not exists public.vocational_graph_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  entity_table text not null,
  entity_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE', 'VALIDATE', 'PUBLISH')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vocations_published_idx
  on public.vocations (is_published, canonical_name) where is_published;
create index if not exists vocations_riasec_idx on public.vocations using gin (riasec_codes);
create index if not exists vocational_concepts_type_idx
  on public.vocational_concepts (concept_type, is_published, canonical_name);
create index if not exists vocational_concepts_parent_idx
  on public.vocational_concepts (parent_id) where parent_id is not null;
create index if not exists vocation_family_family_idx
  on public.vocation_family_memberships (family_id, membership_weight desc);
create index if not exists vocation_concept_vocation_idx
  on public.vocation_concept_links (vocation_id, relationship_type, relevance desc);
create index if not exists vocation_concept_concept_idx
  on public.vocation_concept_links (concept_id, relationship_type, relevance desc);
create index if not exists vocation_relationship_source_idx
  on public.vocation_relationships (source_vocation_id, relationship_type, career_transition_score desc);
create index if not exists vocation_relationship_target_idx
  on public.vocation_relationships (target_vocation_id, relationship_type);
create index if not exists profile_signals_concept_idx
  on public.vocational_profile_signals (concept_id, signal_type);
create index if not exists recommendation_runs_user_idx
  on public.vocational_recommendation_runs (user_id, created_at desc);
create index if not exists recommendation_items_score_idx
  on public.vocational_recommendation_items (run_id, total_score desc);
create index if not exists candidate_relationships_review_idx
  on public.vocational_candidate_relationships (status, confidence desc, created_at);
create index if not exists graph_audit_entity_idx
  on public.vocational_graph_audit_log (entity_table, entity_id, created_at desc);

create or replace function public.vocational_similarity_score(dimensions jsonb)
returns numeric
language sql
immutable
parallel safe
set search_path = ''
as $$
  select round(least(1, greatest(0,
    coalesce((dimensions ->> 'skill_overlap')::numeric, 0) * 0.30 +
    coalesce((dimensions ->> 'interest_overlap')::numeric, 0) * 0.20 +
    coalesce((dimensions ->> 'activity_overlap')::numeric, 0) * 0.15 +
    coalesce((dimensions ->> 'knowledge_overlap')::numeric, 0) * 0.15 +
    coalesce((dimensions ->> 'work_environment_overlap')::numeric, 0) * 0.10 +
    coalesce((dimensions ->> 'industry_overlap')::numeric, 0) * 0.10
  )), 3);
$$;

create or replace function public.vocational_transition_score(dimensions jsonb)
returns numeric
language sql
immutable
parallel safe
set search_path = ''
as $$
  select round(least(1, greatest(0,
    coalesce((dimensions ->> 'transferable_skill_coverage')::numeric, 0) * 0.40 +
    coalesce((dimensions ->> 'knowledge_coverage')::numeric, 0) * 0.15 +
    coalesce((dimensions ->> 'industry_transferability')::numeric, 0) * 0.10 +
    coalesce((dimensions ->> 'environment_compatibility')::numeric, 0) * 0.10 +
    coalesce((dimensions ->> 'education_reuse')::numeric, 0) * 0.10 +
    (1 - coalesce((dimensions ->> 'credential_barrier')::numeric, 1)) * 0.15
  )), 3);
$$;

create or replace function public.vocational_compute_relationship_scores()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.vocational_similarity_score := public.vocational_similarity_score(new.similarity_dimensions);
  new.career_transition_score := public.vocational_transition_score(new.transition_dimensions);
  return new;
end;
$$;

drop trigger if exists vocational_relationship_scores on public.vocation_relationships;
create trigger vocational_relationship_scores
before insert or update of similarity_dimensions, transition_dimensions
on public.vocation_relationships
for each row execute function public.vocational_compute_relationship_scores();

create or replace function public.vocational_audit_graph_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_id uuid;
begin
  row_id := coalesce(new.id, old.id);
  insert into public.vocational_graph_audit_log (
    actor_id, entity_table, entity_id, action, old_data, new_data
  ) values (
    auth.uid(), tg_table_name, row_id, tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'vocational_sources', 'vocational_families', 'vocations', 'vocational_concepts',
    'vocation_concept_links', 'vocation_relationships', 'vocational_candidate_relationships'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'audit_' || table_name, table_name);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.vocational_audit_graph_change()',
      'audit_' || table_name,
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'vocational_sources', 'vocational_families', 'vocations', 'vocational_concepts',
    'vocation_concept_links', 'vocation_relationships', 'vocational_profiles',
    'vocational_candidate_relationships'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'updated_at_' || table_name, table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.vocational_set_updated_at()',
      'updated_at_' || table_name,
      table_name
    );
  end loop;
end;
$$;

create or replace function public.get_related_vocations(
  vocation uuid,
  relation text default null,
  result_limit integer default 12
)
returns table (
  relationship_id uuid,
  target_vocation_id uuid,
  target_slug text,
  target_name_i18n jsonb,
  relationship_type text,
  similarity_score numeric,
  transition_score numeric,
  explanation_i18n jsonb,
  confidence numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    relationship.id,
    target.id,
    target.slug,
    target.name_i18n,
    relationship.relationship_type,
    relationship.vocational_similarity_score,
    relationship.career_transition_score,
    relationship.explanation_i18n,
    relationship.confidence
  from public.vocation_relationships relationship
  join public.vocations target on target.id = relationship.target_vocation_id
  where relationship.source_vocation_id = vocation
    and (relation is null or relationship.relationship_type = relation)
    and relationship.data_status in ('verified', 'human_validated')
    and target.is_published
  order by greatest(
    coalesce(relationship.career_transition_score, 0),
    coalesce(relationship.vocational_similarity_score, 0)
  ) desc, target.canonical_name
  limit greatest(1, least(result_limit, 50));
$$;

create or replace function public.find_vocational_paths(
  source_vocation uuid,
  target_vocation uuid,
  max_depth integer default 4
)
returns table (
  vocation_path uuid[],
  relationship_path uuid[],
  steps integer,
  path_score numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive paths as (
    select
      relationship.target_vocation_id as current_vocation,
      array[relationship.source_vocation_id, relationship.target_vocation_id] as vocation_path,
      array[relationship.id] as relationship_path,
      1 as steps,
      coalesce(relationship.career_transition_score, 0)::numeric as path_score
    from public.vocation_relationships relationship
    join public.vocations target on target.id = relationship.target_vocation_id and target.is_published
    where relationship.source_vocation_id = source_vocation
      and relationship.relationship_type = 'CAN_TRANSITION_TO'
      and relationship.data_status in ('verified', 'human_validated')

    union all

    select
      relationship.target_vocation_id,
      paths.vocation_path || relationship.target_vocation_id,
      paths.relationship_path || relationship.id,
      paths.steps + 1,
      round(paths.path_score * coalesce(relationship.career_transition_score, 0), 6)
    from paths
    join public.vocation_relationships relationship
      on relationship.source_vocation_id = paths.current_vocation
    join public.vocations target on target.id = relationship.target_vocation_id and target.is_published
    where paths.steps < greatest(1, least(max_depth, 6))
      and relationship.relationship_type = 'CAN_TRANSITION_TO'
      and relationship.data_status in ('verified', 'human_validated')
      and not relationship.target_vocation_id = any(paths.vocation_path)
  )
  select paths.vocation_path, paths.relationship_path, paths.steps, paths.path_score
  from paths
  where paths.current_vocation = target_vocation
  order by paths.path_score desc, paths.steps asc
  limit 10;
$$;

create or replace function public.match_vocational_profile(
  profile_user_id uuid,
  result_limit integer default 12
)
returns table (
  vocation_id uuid,
  vocation_slug text,
  vocation_name_i18n jsonb,
  match_score numeric,
  matched_signals jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  with signal_weights(signal_type, weight) as (
    values
      ('interest'::text, 0.25::numeric),
      ('existing_skill', 0.20),
      ('preferred_activity', 0.15),
      ('preferred_environment', 0.10),
      ('academic_preference', 0.10),
      ('liked_subject', 0.08),
      ('industry_interest', 0.07),
      ('disliked_subject', -0.05)
  ), contributions as (
    select
      link.vocation_id,
      signal.concept_id,
      signal.signal_type,
      signal.strength,
      link.relevance,
      weights.weight,
      signal.strength * signal.confidence * link.relevance * weights.weight as contribution
    from public.vocational_profile_signals signal
    join signal_weights weights on weights.signal_type = signal.signal_type
    join public.vocation_concept_links link on link.concept_id = signal.concept_id
    where signal.user_id = profile_user_id
      and (profile_user_id = auth.uid() or public.vocational_is_graph_admin())
      and link.data_status in ('verified', 'human_validated')
  ), grouped as (
    select
      vocation_id,
      greatest(0, least(0.85, sum(contribution))) as structured_score,
      jsonb_agg(
        jsonb_build_object(
          'concept_id', concept_id,
          'signal_type', signal_type,
          'contribution', round(contribution, 5)
        ) order by contribution desc
      ) filter (where contribution > 0) as evidence
    from contributions
    group by vocation_id
  )
  select
    vocation.id,
    vocation.slug,
    vocation.name_i18n,
    round(least(1, grouped.structured_score + case
      when profile.riasec_code is not null
        and vocation.riasec_codes && regexp_split_to_array(profile.riasec_code, '')
      then 0.15 else 0 end), 3) as match_score,
    coalesce(grouped.evidence, '[]'::jsonb)
  from grouped
  join public.vocations vocation on vocation.id = grouped.vocation_id and vocation.is_published
  join public.vocational_profiles profile on profile.user_id = profile_user_id
  order by match_score desc, vocation.canonical_name
  limit greatest(1, least(result_limit, 50));
$$;

grant execute on function public.get_related_vocations(uuid, text, integer) to anon, authenticated;
grant execute on function public.find_vocational_paths(uuid, uuid, integer) to anon, authenticated;
grant execute on function public.match_vocational_profile(uuid, integer) to authenticated;

alter table public.vocational_sources enable row level security;
alter table public.vocational_families enable row level security;
alter table public.vocations enable row level security;
alter table public.vocational_concepts enable row level security;
alter table public.vocation_family_memberships enable row level security;
alter table public.vocation_concept_links enable row level security;
alter table public.vocation_relationships enable row level security;
alter table public.vocation_relationship_evidence enable row level security;
alter table public.vocational_profiles enable row level security;
alter table public.vocational_profile_signals enable row level security;
alter table public.vocational_recommendation_runs enable row level security;
alter table public.vocational_recommendation_items enable row level security;
alter table public.vocational_recommendation_evidence enable row level security;
alter table public.vocational_candidate_relationships enable row level security;
alter table public.vocational_graph_audit_log enable row level security;

create policy "Fuentes activas visibles" on public.vocational_sources
for select using (is_active);
create policy "Familias activas visibles" on public.vocational_families
for select using (is_active);
create policy "Vocaciones publicadas visibles" on public.vocations
for select using (is_published and data_status in ('verified', 'human_validated'));
create policy "Conceptos publicados visibles" on public.vocational_concepts
for select using (is_published and data_status in ('verified', 'human_validated'));
create policy "Membresías publicadas visibles" on public.vocation_family_memberships
for select using (
  exists (select 1 from public.vocations where id = vocation_id and is_published)
  and exists (select 1 from public.vocational_families where id = family_id and is_active)
);
create policy "Conceptos de vocaciones visibles" on public.vocation_concept_links
for select using (
  data_status in ('verified', 'human_validated')
  and exists (select 1 from public.vocations where id = vocation_id and is_published)
);
create policy "Relaciones verificadas visibles" on public.vocation_relationships
for select using (
  data_status in ('verified', 'human_validated')
  and exists (select 1 from public.vocations where id = source_vocation_id and is_published)
  and exists (select 1 from public.vocations where id = target_vocation_id and is_published)
);
create policy "Evidencia de relaciones visible" on public.vocation_relationship_evidence
for select using (
  exists (
    select 1 from public.vocation_relationships
    where id = relationship_id and data_status in ('verified', 'human_validated')
  )
);

create policy "Administradores gestionan fuentes" on public.vocational_sources
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());
create policy "Administradores gestionan familias" on public.vocational_families
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());
create policy "Administradores gestionan vocaciones" on public.vocations
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());
create policy "Administradores gestionan conceptos" on public.vocational_concepts
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());
create policy "Administradores gestionan familias vocacionales" on public.vocation_family_memberships
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());
create policy "Administradores gestionan enlaces conceptuales" on public.vocation_concept_links
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());
create policy "Administradores gestionan relaciones" on public.vocation_relationships
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());
create policy "Administradores gestionan evidencia" on public.vocation_relationship_evidence
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());

create policy "Usuarios ven su perfil vocacional" on public.vocational_profiles
for select to authenticated using (user_id = auth.uid() or public.vocational_is_graph_admin());
create policy "Usuarios crean su perfil vocacional" on public.vocational_profiles
for insert to authenticated with check (user_id = auth.uid());
create policy "Usuarios actualizan su perfil vocacional" on public.vocational_profiles
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Usuarios eliminan su perfil vocacional" on public.vocational_profiles
for delete to authenticated using (user_id = auth.uid());

create policy "Usuarios ven sus señales" on public.vocational_profile_signals
for select to authenticated using (user_id = auth.uid() or public.vocational_is_graph_admin());
create policy "Usuarios crean sus señales" on public.vocational_profile_signals
for insert to authenticated with check (user_id = auth.uid());
create policy "Usuarios actualizan sus señales" on public.vocational_profile_signals
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Usuarios eliminan sus señales" on public.vocational_profile_signals
for delete to authenticated using (user_id = auth.uid());

create policy "Usuarios ven sus ejecuciones" on public.vocational_recommendation_runs
for select to authenticated using (user_id = auth.uid() or public.vocational_is_graph_admin());
create policy "Usuarios crean sus ejecuciones" on public.vocational_recommendation_runs
for insert to authenticated with check (user_id = auth.uid());
create policy "Usuarios ven sus recomendaciones" on public.vocational_recommendation_items
for select to authenticated using (
  exists (
    select 1 from public.vocational_recommendation_runs
    where id = run_id and (user_id = auth.uid() or public.vocational_is_graph_admin())
  )
);
create policy "Usuarios ven evidencia de sus recomendaciones" on public.vocational_recommendation_evidence
for select to authenticated using (
  exists (
    select 1 from public.vocational_recommendation_runs
    where id = run_id and (user_id = auth.uid() or public.vocational_is_graph_admin())
  )
);

create policy "Administradores gestionan candidatos" on public.vocational_candidate_relationships
for all to authenticated using (public.vocational_is_graph_admin()) with check (public.vocational_is_graph_admin());
create policy "Administradores ven auditoría" on public.vocational_graph_audit_log
for select to authenticated using (public.vocational_is_graph_admin());

comment on table public.vocations is 'Profesiones y vocaciones navegables; no representan un diagnóstico determinista.';
comment on table public.vocational_concepts is 'Conceptos reutilizables tipados: habilidades, intereses, actividades, industrias, formación y entorno.';
comment on table public.vocation_relationships is 'Aristas semánticas entre vocaciones con similitud y transición calculadas por separado.';
comment on table public.vocational_candidate_relationships is 'Zona de revisión para relaciones propuestas por embeddings, LLM, reglas o importaciones.';
comment on function public.match_vocational_profile(uuid, integer) is 'Ranking explicable de rutas a explorar; no selecciona una profesión ideal.';
