begin;

alter table public.habitos_items
  add column if not exists categoria text,
  add column if not exists dificultad text not null default 'estandar' check (dificultad in ('minimo', 'estandar', 'reto')),
  add column if not exists disparador text,
  add column if not exists recompensa text;

alter table public.habitos_planes
  add column if not exists recordatorio_activo boolean not null default false,
  add column if not exists hora_recordatorio time,
  add column if not exists mostrar_nombre_notificacion boolean not null default false,
  add constraint habitos_planes_recordatorio_hora_check check (not recordatorio_activo or hora_recordatorio is not null);

create table if not exists public.habitos_registro_senales (
  registro_id uuid primary key references public.habitos_registros(id) on delete cascade,
  energia smallint check (energia between 1 and 5),
  animo smallint check (animo between 1 and 5),
  contexto_texto text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contexto_texto is null or char_length(trim(contexto_texto)) between 1 and 280)
);

alter table public.habitos_registro_senales enable row level security;
create policy habitos_registro_senales_propias on public.habitos_registro_senales for all
  using (exists (select 1 from public.habitos_registros r where r.id = registro_id and r.usuario_id = auth.uid()))
  with check (exists (select 1 from public.habitos_registros r where r.id = registro_id and r.usuario_id = auth.uid()));
create trigger habitos_registro_senales_updated_at before update on public.habitos_registro_senales for each row execute procedure public.set_updated_at();
grant select, insert, update, delete on public.habitos_registro_senales to authenticated;

insert into public.catalogo_notificaciones (codigo, grupo, prioridad, es_proactiva, descripcion)
values ('habito_recordatorio', 'programada', 7, false, 'Recordatorio programado para un hábito.')
on conflict (codigo) do update set activo = true, descripcion = excluded.descripcion;

insert into public.preferencias_notificacion_usuario (usuario_id, catalogo_codigo)
select perfil.id, 'habito_recordatorio' from public.perfiles_usuario perfil
on conflict do nothing;

commit;
