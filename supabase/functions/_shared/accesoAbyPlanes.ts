// Supabase Edge Function (compartido). Run `deno check` through the Supabase CLI, not Expo's TypeScript command.
// @ts-nocheck
//
// Chequeo server-side de "¿puede este usuario pedirle una generación a Aby
// para Planes ahora mismo?" — dos reglas, en este orden:
//   1) Horizon activo — verificado contra la API de RevenueCat, NUNCA
//      confiando en lo que mande el cliente (el estado de Horizon que ve la
//      app sale del SDK on-device, que un cliente modificado podría falsear).
//   2) Tope mensual de generaciones — protege el costo real de cada llamada
//      a Gemini, independiente del tier de suscripción.
// Usado por generar-plan-inicial y detallar-seccion-plan — misma regla,
// mismo orden, un solo lugar para no desincronizar los dos.
const ENTITLEMENT_HORIZON = 'horizon';
const TOPE_GENERACIONES_MES = 20;

export type ResultadoAcceso =
  | { ok: true }
  | { codigo: 'horizon_inactivo' | 'revenuecat_no_disponible' | 'tope_mensual'; mensaje: string; ok: false };

function primerDiaDelMes(): string {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

// null = no se pudo confirmar (RevenueCat no configurado o la llamada falló)
// — el caller decide qué responder, nunca se asume "activo" por default.
async function horizonActivo(usuarioId: string): Promise<boolean | null> {
  const secreto = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!secreto) return null;

  let respuesta: Response;
  try {
    respuesta = await fetch(`https://api.revenuecat.com/v1/subscribers/${usuarioId}`, {
      headers: { Authorization: `Bearer ${secreto}` },
    });
  } catch {
    return null;
  }
  if (!respuesta.ok) return null;

  const cuerpo = await respuesta.json().catch(() => null);
  const entitlement = cuerpo?.subscriber?.entitlements?.[ENTITLEMENT_HORIZON];
  if (!entitlement) return false;
  // expires_date null = acceso sin vencimiento (lifetime/promocional); si
  // viene, el entitlement sigue activo solo mientras sea futuro.
  if (!entitlement.expires_date) return true;
  return new Date(entitlement.expires_date).getTime() > Date.now();
}

export async function verificarAccesoAby(clienteServidor: any, usuarioId: string, plataforma?: string): Promise<ResultadoAcceso> {
  // ⚠️ BYPASS TEMPORAL — Android todavía no tiene un producto Horizon real en
  // Play Store/RevenueCat (decisión 2026-10-05) — se trata como si siempre
  // tuviera el entitlement activo, sin llamar a RevenueCat. Sigue sujeto al
  // tope mensual de abajo (es control de costo, no de pago). iOS (y
  // cualquier otro valor) usa siempre el chequeo real. Sacar esto en cuanto
  // el producto de Android exista.
  const activo = plataforma === 'android' ? true : await horizonActivo(usuarioId);
  if (activo === null) {
    return { codigo: 'revenuecat_no_disponible', mensaje: 'No pudimos confirmar tu suscripción. Intentalo de nuevo en un momento.', ok: false };
  }
  if (!activo) {
    return { codigo: 'horizon_inactivo', mensaje: 'Crear planes con Aby es parte de Horizon.', ok: false };
  }

  const mes = primerDiaDelMes();
  const fila = await clienteServidor.from('planes_generaciones_uso').select('cantidad').eq('usuario_id', usuarioId).eq('mes', mes).maybeSingle();
  const cantidadActual = fila.data?.cantidad ?? 0;
  if (cantidadActual >= TOPE_GENERACIONES_MES) {
    return { codigo: 'tope_mensual', mensaje: 'Llegaste al límite de generaciones con Aby este mes. Probá de nuevo el mes que viene.', ok: false };
  }
  return { ok: true };
}

// Se llama solo tras una generación EXITOSA (si Gemini falla, no se cobra
// contra el tope) — mismo criterio que aby_propuestas solo marca 'lista' en
// éxito.
export async function registrarUsoAby(clienteServidor: any, usuarioId: string): Promise<void> {
  const mes = primerDiaDelMes();
  const fila = await clienteServidor.from('planes_generaciones_uso').select('cantidad').eq('usuario_id', usuarioId).eq('mes', mes).maybeSingle();
  const cantidadActual = fila.data?.cantidad ?? 0;
  await clienteServidor.from('planes_generaciones_uso').upsert({ cantidad: cantidadActual + 1, mes, usuario_id: usuarioId });
}
