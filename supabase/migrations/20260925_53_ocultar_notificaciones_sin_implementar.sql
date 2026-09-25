-- Oculta del selector de Perfil las categorías de notificación que todavía
-- no tienen ningún disparo real detrás (ver docs/superpowers/plans —
-- solo 'habito_recordatorio' está conectado al despacho de
-- despachar-recordatorios-habitos). Mostrar un toggle que guarda sin que
-- nada lo consulte para enviar una notificación es confuso para el usuario
-- ("activé esto y nunca me llegó nada"). Se marcan inactivas en vez de
-- borrarlas para no perder el catálogo cuando se implementen de verdad.
update public.catalogo_notificaciones
set activo = false
where codigo in (
  'hoy_cofre_disponible',
  'hoy_evaluacion_disponible',
  'hoy_racha_recuperable',
  'hoy_repaso_pendiente',
  'hoy_resumen_diario',
  'hoy_sesion_inicio',
  'hoy_sesion_proxima'
);
