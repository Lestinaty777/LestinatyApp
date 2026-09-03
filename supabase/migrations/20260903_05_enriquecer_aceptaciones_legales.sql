-- Metadatos suficientes para mostrar aceptaciones legales en la UI autenticada.

create or replace function privacidad.obtener_mis_aceptaciones_legales()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'documento_id', aceptacion.documento_id,
        'codigo', documento.codigo,
        'version', documento.version,
        'idioma', documento.idioma,
        'url_publica', documento.url_publica,
        'aceptado_at', aceptacion.aceptado_at,
        'origen', aceptacion.origen
      ) order by aceptacion.aceptado_at desc
    ),
    '[]'::jsonb
  )
  from privacidad.aceptaciones_documentos_legales as aceptacion
  join public.documentos_legales as documento on documento.id = aceptacion.documento_id
  where aceptacion.usuario_id = auth.uid();
$$;

revoke all on function privacidad.obtener_mis_aceptaciones_legales() from public, anon;
grant execute on function privacidad.obtener_mis_aceptaciones_legales() to authenticated, service_role;
