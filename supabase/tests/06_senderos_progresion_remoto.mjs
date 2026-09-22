import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

function loadEnvironment() {
  const path = existsSync('.env.local') ? '.env.local' : '.env';
  const values = {};

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }

  return values;
}

const env = loadEnvironment();
const url = env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = env.SUPABASE_SECRET_KEY;

if (!url || !anonKey || !secretKey) {
  throw new Error('Missing Supabase URL, anon key, or secret key in .env.local/.env.');
}

async function request(path, { key = anonKey, token = key, method = 'GET', body, headers } = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: key,
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createUser(email, password) {
  const data = await request('/auth/v1/admin/users', {
    key: secretKey,
    token: secretKey,
    method: 'POST',
    body: { email, password, email_confirm: true },
  });
  return data.user ?? data;
}

async function deleteUser(userId) {
  await request(`/auth/v1/admin/users/${userId}`, {
    key: secretKey,
    token: secretKey,
    method: 'DELETE',
  });
}

async function signIn(email, password) {
  return request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
}

async function rpc(accessToken, name, body = {}) {
  return request(`/rest/v1/rpc/${name}`, {
    token: accessToken,
    method: 'POST',
    body,
  });
}

function fechaLocalUtc(diasDesdeHoy) {
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + diasDesdeHoy);
  return fecha.toISOString().slice(0, 10);
}

const runId = randomUUID();
const password = `Lst-${randomUUID()}-aA1!`;
const email = `smoke-sendero-remoto-${runId}@lestinaty.invalid`;
let user;

try {
  user = await createUser(email, password);
  const session = await signIn(email, password);
  const token = session.access_token;

  const habito = await rpc(token, 'crear_habito_premium', {
    p_titulo: 'Sendero smoke remoto',
    p_descripcion: null,
    p_icono_lucide: 'Sparkles',
    p_color: '#22C55E',
    p_tipo_meta: 'cantidad',
    p_unidad: 'min',
    p_categoria: null,
    p_dificultad: 'estandar',
    p_disparador: null,
    p_recompensa: null,
    p_frecuencia: 'diaria',
    p_dias_semana: null,
    p_veces_por_semana: null,
    p_objetivo_valor: 10,
    p_recordatorio_activo: false,
    p_hora_recordatorio: null,
    p_mostrar_nombre_notificacion: false,
    p_desde_fecha: fechaLocalUtc(-2),
    p_nivel_inicial: 1,
    p_paquete_id: 'esmeralda',
  });
  const habitoId = habito.id;

  await rpc(token, 'registrar_progreso_habito', { p_habito_id: habitoId, p_fecha_local: fechaLocalUtc(-2), p_valor: 10, p_nota: null });
  await rpc(token, 'registrar_progreso_habito', { p_habito_id: habitoId, p_fecha_local: fechaLocalUtc(-1), p_valor: 10, p_nota: null });
  const resultado = await rpc(token, 'registrar_progreso_habito', { p_habito_id: habitoId, p_fecha_local: fechaLocalUtc(0), p_valor: 10, p_nota: null });

  assert(resultado.transicion_sendero?.tipo === 'nivel', `Debe desbloquear nivel 2. Transición: ${JSON.stringify(resultado.transicion_sendero)}`);
  assert(resultado.transicion_sendero?.gemas === 10, `El cofre final debe entregar 10 gemas, fue ${resultado.transicion_sendero?.gemas}`);

  const resumen = await rpc(token, 'obtener_resumen_sendero_habito', { p_habito_id: habitoId });
  assert(resumen.secciones.length === 7, `El resumen debe traer siete secciones, trajo ${resumen.secciones.length}`);
  assert(resumen.secciones[1].estado === 'actual', `Nivel 2 debe estar desbloqueado, fue ${resumen.secciones[1].estado}`);
  assert(resumen.secciones[0].estado === 'completado', `Nivel 1 debe quedar completado, fue ${resumen.secciones[0].estado}`);

  const saldoAntes = await request('/rest/v1/rpc/obtener_saldo_gemas', { token, method: 'POST', body: {} });

  // Repetir el registro de hoy no debe volver a pagar el cofre final.
  const repetido = await rpc(token, 'registrar_progreso_habito', { p_habito_id: habitoId, p_fecha_local: fechaLocalUtc(0), p_valor: 10, p_nota: 'repetido' });
  assert(repetido.transicion_sendero === null, `Repetir el registro de hoy no debe volver a pagar, transición: ${JSON.stringify(repetido.transicion_sendero)}`);

  const saldoDespues = await request('/rest/v1/rpc/obtener_saldo_gemas', { token, method: 'POST', body: {} });
  assert(saldoAntes === saldoDespues, `Repetir el registro no debe cambiar el saldo: antes ${saldoAntes}, después ${saldoDespues}`);

  const cofres = await request(`/rest/v1/habitos_cofres_reclamados?habito_id=eq.${habitoId}&nivel=eq.1&tipo=eq.final`, { token });
  assert(cofres.length === 1, `Debe haber exactamente una fila de cofre final para nivel 1, hubo ${cofres.length}`);

  console.log('Remote Senderos progression smoke test passed.');
} finally {
  if (user) {
    await deleteUser(user.id);
  }
}
