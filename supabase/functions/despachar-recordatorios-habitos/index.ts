// Ejecutada por pg_cron/pg_net. No se invoca desde Expo.
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Dispositivo = { id: string; subscription_id: string };
type Textos = { es: string; en: string };
type RecordatorioHabito = {
  dispositivos: Dispositivo[];
  habito_id: string;
  mostrar_nombre: boolean;
  notificacion_id: string;
  preferencia_activa: boolean;
  titulo_habito: string;
};
// Misma forma que RecordatorioHabito (reclamar_recordatorios_tareas es la
// hermana de reclamar_recordatorios_habitos), cambia habito_id/titulo_habito
// por tarea_id/titulo_tarea — se distinguen por cuál de los dos campos trae.
type RecordatorioTarea = {
  dispositivos: Dispositivo[];
  mostrar_nombre: boolean;
  notificacion_id: string;
  preferencia_activa: boolean;
  tarea_id: string;
  titulo_tarea: string;
};
// Tercer origen (migración 84): reclamar_recordatorios_rutinas devuelve la
// misma forma con rutina_id/titulo_rutina.
type RecordatorioRutina = {
  dispositivos: Dispositivo[];
  mostrar_nombre: boolean;
  notificacion_id: string;
  preferencia_activa: boolean;
  rutina_id: string;
  titulo_rutina: string;
};
type RecordatorioReclamado = RecordatorioHabito | RecordatorioTarea | RecordatorioRutina;

// Lo único que cambia entre los tres orígenes: de qué se habla, cómo se llama
// y a qué pantalla lleva el toque.
function describir(recordatorio: RecordatorioReclamado): { nombre: Textos; ruta: string; titulo: string } {
  if ('rutina_id' in recordatorio) {
    return { nombre: { en: 'routine', es: 'rutina' }, ruta: `/rutinas/${recordatorio.rutina_id}`, titulo: recordatorio.titulo_rutina };
  }
  if ('tarea_id' in recordatorio) {
    return { nombre: { en: 'task', es: 'tarea' }, ruta: `/tareas/${recordatorio.tarea_id}`, titulo: recordatorio.titulo_tarea };
  }
  return { nombre: { en: 'habit', es: 'hábito' }, ruta: `/habitos/${recordatorio.habito_id}`, titulo: recordatorio.titulo_habito };
}

const jsonHeaders = { 'Content-Type': 'application/json' };

function responder(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { headers: jsonHeaders, status });
}

// Cada texto va en español e inglés: OneSignal elige según el idioma del
// dispositivo (antes ambos llevaban el español).
function decidir(recordatorio: RecordatorioReclamado) {
  if (!recordatorio.preferencia_activa) return { accion: 'cancelar' as const, razon: 'preferencia_inactiva' };
  if (!recordatorio.dispositivos.length) return { accion: 'cancelar' as const, razon: 'sin_dispositivo' };
  const { nombre, ruta, titulo } = describir(recordatorio);
  if (recordatorio.mostrar_nombre) {
    const cuerpo: Textos = {
      en: `Your ${nombre.en} ${titulo} is waiting. One small step counts today.`,
      es: `Tu ${nombre.es} ${titulo} te espera. Una pequeña acción cuenta hoy.`,
    };
    return { accion: 'enviar' as const, cuerpo, ruta, titulo: { en: titulo, es: titulo } };
  }
  return {
    accion: 'enviar' as const,
    cuerpo: { en: 'One small step counts today.', es: 'Una pequeña acción cuenta hoy.' },
    ruta,
    titulo: { en: `It's time for your ${nombre.en}`, es: `Es momento de tu ${nombre.es}` },
  };
}

async function finalizar(cliente: ReturnType<typeof createClient>, recordatorio: RecordatorioReclamado, estado: 'enviada' | 'cancelada' | 'fallida', opciones: { error?: string; proveedorId?: string } = {}) {
  const { error } = await cliente.rpc('finalizar_recordatorio_habito', {
    p_dispositivos: recordatorio.dispositivos.map((dispositivo) => dispositivo.id),
    p_error_codigo: opciones.error ?? null,
    p_estado: estado,
    p_notificacion_id: recordatorio.notificacion_id,
    p_proveedor_id: opciones.proveedorId ?? null,
  });
  if (error) throw error;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return responder(405, { codigo: 'metodo', mensaje: 'Método no permitido.' });

  const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
  if (!schedulerSecret || request.headers.get('x-scheduler-secret') !== schedulerSecret) {
    return responder(401, { codigo: 'autorizacion', mensaje: 'Invocación no autorizada.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
  const oneSignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  if (!supabaseUrl || !serviceRole || !oneSignalAppId || !oneSignalRestKey) {
    return responder(503, { codigo: 'configuracion', mensaje: 'El servicio de recordatorios no está configurado.' });
  }

  const cliente = createClient(supabaseUrl, serviceRole);
  // Las tres colas son independientes: si una falla, las otras se procesan igual.
  const [habitos, tareas, rutinas] = await Promise.all([
    cliente.rpc('reclamar_recordatorios_habitos', { p_limite: 100 }),
    cliente.rpc('reclamar_recordatorios_tareas', { p_limite: 100 }),
    cliente.rpc('reclamar_recordatorios_rutinas', { p_limite: 100 }),
  ]);
  if (habitos.error && tareas.error && rutinas.error) return responder(502, { codigo: 'cola', mensaje: 'No se pudo reclamar la cola de recordatorios.' });

  const recordatorios = [
    ...(Array.isArray(habitos.data) ? habitos.data as RecordatorioReclamado[] : []),
    ...(Array.isArray(tareas.data) ? tareas.data as RecordatorioReclamado[] : []),
    ...(Array.isArray(rutinas.data) ? rutinas.data as RecordatorioReclamado[] : []),
  ];
  let enviados = 0;
  let cancelados = 0;
  let fallidos = 0;

  for (const recordatorio of recordatorios) {
    const decision = decidir(recordatorio);
    if (decision.accion === 'cancelar') {
      // Un fallo al cerrar uno no debe cortar el lote: los que siguen
      // quedarían 'reclamada' para siempre, sin reintento.
      await finalizar(cliente, recordatorio, 'cancelada', { error: decision.razon }).catch(() => undefined);
      cancelados += 1;
      continue;
    }

    try {
      const respuesta = await fetch('https://api.onesignal.com/notifications?c=push', {
        body: JSON.stringify({
          app_id: oneSignalAppId,
          // collapse_id: si un reintento reenvía el mismo recordatorio, el
          // dispositivo lo reemplaza en vez de mostrarlo dos veces.
          collapse_id: recordatorio.notificacion_id,
          contents: decision.cuerpo,
          data: { notificacion_id: recordatorio.notificacion_id, ruta: decision.ruta },
          headings: decision.titulo,
          include_subscription_ids: recordatorio.dispositivos.map((dispositivo) => dispositivo.subscription_id),
          target_channel: 'push',
        }),
        headers: { Authorization: `Key ${oneSignalRestKey}`, 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok || !payload?.id) throw new Error(`onesignal_${respuesta.status}`);
      await finalizar(cliente, recordatorio, 'enviada', { proveedorId: payload.id }).catch(() => undefined);
      enviados += 1;
    } catch (error) {
      const codigo = error instanceof Error ? error.message.slice(0, 120) : 'onesignal_error';
      await finalizar(cliente, recordatorio, 'fallida', { error: codigo }).catch(() => undefined);
      fallidos += 1;
    }
  }

  return responder(200, { cancelados, enviados, fallidos, procesados: recordatorios.length });
});
