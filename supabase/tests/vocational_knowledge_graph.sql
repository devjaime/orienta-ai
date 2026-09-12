begin;

do $$
declare
  similarity numeric;
  transition numeric;
begin
  similarity := public.vocational_similarity_score(jsonb_build_object(
    'skill_overlap', 1,
    'interest_overlap', 1,
    'activity_overlap', 1,
    'knowledge_overlap', 1,
    'work_environment_overlap', 1,
    'industry_overlap', 1
  ));
  if similarity <> 1 then
    raise exception 'Score de similitud esperado 1, obtenido %', similarity;
  end if;

  transition := public.vocational_transition_score(jsonb_build_object(
    'transferable_skill_coverage', 1,
    'knowledge_coverage', 1,
    'industry_transferability', 1,
    'environment_compatibility', 1,
    'education_reuse', 1,
    'credential_barrier', 0
  ));
  if transition <> 1 then
    raise exception 'Score de transición esperado 1, obtenido %', transition;
  end if;

  if public.vocational_transition_score(jsonb_build_object('credential_barrier', 1)) <> 0 then
    raise exception 'Una transición sin cobertura y con barrera máxima debe puntuar 0';
  end if;
end;
$$;

do $$
declare
  source_id uuid := gen_random_uuid();
  target_id uuid := gen_random_uuid();
  relationship_id uuid;
  computed_similarity numeric;
  computed_transition numeric;
begin
  insert into public.vocations (
    id, slug, canonical_name, name_i18n, data_status, confidence, is_published
  ) values
    (source_id, 'test-source-vocation', 'Test Source Vocation', '{"es":"Origen","en":"Source"}', 'verified', 1, true),
    (target_id, 'test-target-vocation', 'Test Target Vocation', '{"es":"Destino","en":"Target"}', 'verified', 1, true);

  insert into public.vocation_relationships (
    source_vocation_id,
    target_vocation_id,
    relationship_type,
    similarity_dimensions,
    transition_dimensions,
    data_status,
    confidence
  ) values (
    source_id,
    target_id,
    'CAN_TRANSITION_TO',
    '{"skill_overlap":0.8,"interest_overlap":0.7,"activity_overlap":0.6,"knowledge_overlap":0.5,"work_environment_overlap":0.9,"industry_overlap":0.8}',
    '{"transferable_skill_coverage":0.8,"knowledge_coverage":0.6,"industry_transferability":0.7,"environment_compatibility":0.9,"education_reuse":0.8,"credential_barrier":0.2}',
    'verified',
    0.9
  ) returning id, vocational_similarity_score, career_transition_score
    into relationship_id, computed_similarity, computed_transition;

  if computed_similarity <> 0.715 then
    raise exception 'Trigger calculó similitud %, se esperaba 0.715', computed_similarity;
  end if;
  if computed_transition <> 0.770 then
    raise exception 'Trigger calculó transición %, se esperaba 0.770', computed_transition;
  end if;

  if not exists (
    select 1 from public.get_related_vocations(source_id, 'CAN_TRANSITION_TO', 5)
    where target_vocation_id = target_id
  ) then
    raise exception 'get_related_vocations no devolvió la relación verificada';
  end if;
end;
$$;

rollback;
