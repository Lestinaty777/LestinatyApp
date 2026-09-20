// Webhook de RevenueCat: única forma real de que una persona reciba gemas
// compradas con dinero. Expo nunca llama esta función ni puede acreditar
// gemas por sí misma (ver supabase/comercio-schema.md). RevenueCat valida el
// recibo de App Store/Play Store por su cuenta y nos avisa aquí cuando una
// compra ya se confirmó.
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type EventoRevenueCat = {
  app_user_id?: string;
  entitlement_ids?: string[];
  environment?: 'SANDBOX' | 'PRODUCTION';
  id: string;
  period_type?: string;
  product_id?: string;
  type: string;
};

const ENTITLEMENT_HORIZON = 'horizon';

const jsonHeaders = { 'Content-Type': 'application/json' };
const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Solo estos tipos representan una compra de gemas ya confirmada. El resto
// (CANCELLATION, EXPIRATION, BILLING_ISSUE, RENEWAL de suscripciones, etc.)
// no nos interesa todavía — se responde 200 igual para que RevenueCat no
// reintente indefinidamente.
const TIPOS_QUE_ACREDITAN = new Set(['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE']);

function responder(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { headers: jsonHeaders, status });
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return responder(405, { codigo: 'metodo', mensaje: 'Método no permitido.' });

  const secreto = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secreto || request.headers.get('authorization') !== secreto) {
    return responder(401, { codigo: 'autorizacion', mensaje: 'Invocación no autorizada.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) {
    return responder(503, { codigo: 'configuracion', mensaje: 'El servicio de compras no está configurado.' });
  }

  let cuerpo: { event?: EventoRevenueCat };
  try {
    cuerpo = await request.json();
  } catch {
    return responder(400, { codigo: 'payload', mensaje: 'JSON inválido.' });
  }

  const evento = cuerpo.event;
  if (!evento?.id || !evento.type) {
    return responder(400, { codigo: 'payload', mensaje: 'Evento incompleto.' });
  }

  // Reconocido pero no accionable (suscripción, cancelación, prueba desde el
  // dashboard, etc.) — 200 para que RevenueCat no lo reintente.
  if (!TIPOS_QUE_ACREDITAN.has(evento.type)) {
    return responder(200, { accion: 'ignorado', tipo: evento.type });
  }

  if (!evento.app_user_id || !REGEX_UUID.test(evento.app_user_id)) {
    // app_user_id debe ser el auth.uid() de Supabase (Purchases.logIn en el
    // cliente); si no lo es, no hay a quién acreditarle — no reintentar.
    return responder(200, { accion: 'sin_usuario_valido', tipo: evento.type });
  }

  const cliente = createClient(supabaseUrl, serviceRole);

  // Inicio de trial de Horizon: nunca va a matchear el catálogo de gemas de
  // abajo, así que se resuelve acá de forma explícita en vez de caer por
  // descarte en "producto_no_es_gemas". Esta marca es la ÚNICA fuente de
  // verdad server-side de "este usuario inició un trial" — la usa
  // otorgar_semilla_trial_horizon() para no confiar en nada que mande el cliente.
  if (evento.type === 'INITIAL_PURCHASE' && evento.period_type === 'TRIAL' && evento.entitlement_ids?.includes(ENTITLEMENT_HORIZON)) {
    // marcar_trial_horizon_iniciado también acredita el bono de 300 gemas
    // (una sola vez, gracias al `found` interno) — evento.id como referencia
    // de idempotencia, así un reintento del mismo webhook no acredita dos veces.
    const { error: errorTrial } = await cliente.rpc('marcar_trial_horizon_iniciado', {
      p_persona_id: evento.app_user_id,
      p_evento_id: evento.id,
    });
    if (errorTrial) return responder(502, { codigo: 'trial_horizon', mensaje: 'No se pudo registrar el trial.' });
    return responder(200, { accion: 'trial_horizon_iniciado' });
  }

  const { data: paquete, error: errorPaquete } = await cliente
    .from('paquetes_gemas_iap')
    .select('cantidad_gemas')
    .eq('product_id_revenuecat', evento.product_id ?? '')
    .eq('activo', true)
    .maybeSingle();

  if (errorPaquete) return responder(502, { codigo: 'catalogo', mensaje: 'No se pudo leer el catálogo de paquetes.' });
  if (!paquete) {
    // product_id no es un paquete de gemas conocido (podría ser otro producto
    // futuro, ej. una suscripción) — no es un error nuestro, solo ignorar.
    return responder(200, { accion: 'producto_no_es_gemas', producto: evento.product_id });
  }

  const { data: saldo, error: errorCredito } = await cliente.rpc('acreditar_gemas', {
    p_persona_id: evento.app_user_id,
    p_cantidad: paquete.cantidad_gemas,
    p_motivo: 'compra_iap',
    p_referencia: evento.id,
  });

  if (errorCredito) return responder(502, { codigo: 'credito', mensaje: 'No se pudo acreditar la compra.' });

  return responder(200, { accion: 'acreditado', gemas: paquete.cantidad_gemas, saldo });
});
