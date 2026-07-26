insert into public.medicine_identity_cache (
  namespace,
  code,
  canonical_name,
  normalized_name,
  ingredient_name,
  ingredient_normalized,
  therapeutic_class,
  jurisdiction,
  aliases,
  source_release_id
)
select
  'curated',
  seed.code,
  seed.canonical_name,
  seed.normalized_name,
  seed.ingredient_name,
  seed.ingredient_normalized,
  null,
  'GB',
  seed.aliases,
  release.id
from public.interaction_source_releases release
cross join (
  values
    (
      'acetaminophen-gb',
      'Paracetamol',
      'acetaminophen',
      'Acetaminophen',
      'acetaminophen',
      array['Paracetamol']
    ),
    (
      'betahistine-gb',
      'Betahistine',
      'betahistine',
      'Betahistine',
      'betahistine',
      array[]::text[]
    ),
    (
      'quinine-gb',
      'Quinine sulfate',
      'quinine',
      'Quinine',
      'quinine',
      array['Quinine sulfate']
    )
) as seed(
  code,
  canonical_name,
  normalized_name,
  ingredient_name,
  ingredient_normalized,
  aliases
)
where release.source_key = 'signalrx-curated-lifestyle'
  and release.version = '2026-07-26'
on conflict (namespace, code) do update
set
  canonical_name = excluded.canonical_name,
  normalized_name = excluded.normalized_name,
  ingredient_name = excluded.ingredient_name,
  ingredient_normalized = excluded.ingredient_normalized,
  jurisdiction = excluded.jurisdiction,
  aliases = excluded.aliases,
  source_release_id = excluded.source_release_id;
