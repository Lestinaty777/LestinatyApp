begin;

select case when to_regclass('privacidad.notificaciones_programadas') is not null then 1 else 1 / 0 end;
select case when to_regclass('privacidad.notificaciones_entregas') is not null then 1 else 1 / 0 end;
select case when to_regclass('privacidad.notificacion_interacciones') is not null then 1 else 1 / 0 end;
select case when to_regprocedure('public.reclamar_recordatorios_habitos(integer)') is not null then 1 else 1 / 0 end;
select case when to_regprocedure('public.finalizar_recordatorio_habito(uuid,text,text,text,jsonb)') is not null then 1 else 1 / 0 end;

rollback;
