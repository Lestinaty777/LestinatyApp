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

async function deleteStaleSmokeUsers() {
  const data = await request('/auth/v1/admin/users?per_page=1000', {
    key: secretKey,
    token: secretKey,
  });
  const users = data.users ?? [];
  const staleUsers = users.filter((user) =>
    /^smoke-[ab]-/.test(user.email ?? '') && user.email.endsWith('@lestinaty.invalid'),
  );

  for (const user of staleUsers) {
    await deleteUser(user.id);
  }
}

async function deleteStaleSmokeDocuments() {
  const documents = await request(
    '/rest/v1/documentos_legales?select=id&contenido_hash=like.remote-smoke-*',
    { key: secretKey, token: secretKey },
  );

  for (const document of documents) {
    await request(`/rest/v1/documentos_legales?id=eq.${document.id}`, {
      key: secretKey,
      token: secretKey,
      method: 'DELETE',
    });
  }
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

const runId = randomUUID();
const password = `Lst-${randomUUID()}-aA1!`;
const emailA = `smoke-a-${runId}@lestinaty.invalid`;
const emailB = `smoke-b-${runId}@lestinaty.invalid`;
const deviceId = `smoke-${runId}`;
let userA;
let userB;
let documentId;

try {
  await deleteStaleSmokeUsers();
  await deleteStaleSmokeDocuments();
  userA = await createUser(emailA, password);
  userB = await createUser(emailB, password);

  const sessionA = await signIn(emailA, password);
  const sessionB = await signIn(emailB, password);

  const initialPermissions = await rpc(sessionA.access_token, 'obtener_permisos_datos');
  assert(initialPermissions.usuario_id === userA.id, 'New user permissions belong to the wrong user.');
  assert(
    !initialPermissions.permite_contexto_aby
      && !initialPermissions.permite_procesar_fuentes
      && !initialPermissions.permite_analitica_producto
      && initialPermissions.revocado_at,
    'New users must start with every optional data permission revoked.',
  );

  const updatedPermissions = await rpc(sessionA.access_token, 'actualizar_permisos_datos', {
    p_permite_contexto_aby: true,
    p_permite_procesar_fuentes: false,
    p_permite_analitica_producto: false,
    p_version_aviso: 'remote-smoke-v1',
  });
  const repeatedPermissions = await rpc(sessionA.access_token, 'actualizar_permisos_datos', {
    p_permite_contexto_aby: true,
    p_permite_procesar_fuentes: false,
    p_permite_analitica_producto: false,
    p_version_aviso: 'remote-smoke-v1',
  });
  assert(updatedPermissions.otorgado_at, 'Granting consent must record otorgado_at.');
  assert(
    updatedPermissions.updated_at === repeatedPermissions.updated_at,
    'Repeating the same consent must be idempotent.',
  );

  const firstRequest = await rpc(sessionA.access_token, 'crear_solicitud_privacidad', {
    p_tipo: 'exportacion',
    p_motivo: 'remote smoke test',
  });
  const repeatedRequest = await rpc(sessionA.access_token, 'crear_solicitud_privacidad', {
    p_tipo: 'exportacion',
    p_motivo: 'remote smoke test',
  });
  assert(firstRequest.id === repeatedRequest.id, 'Active privacy requests must be idempotent.');

  const activeRequests = await rpc(sessionA.access_token, 'obtener_solicitudes_privacidad_activas');
  assert(activeRequests.length === 1 && activeRequests[0].id === firstRequest.id, 'User must read only their active privacy request.');

  const documents = await request('/rest/v1/documentos_legales', {
    key: secretKey,
    token: secretKey,
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      codigo: 'privacidad',
      version: `remote-smoke-${runId}`,
      idioma: 'es',
      url_publica: 'https://example.invalid/lestinaty/remote-smoke',
      contenido_hash: `remote-smoke-${runId}`,
    },
  });
  documentId = documents[0].id;

  const publicDocuments = await request(`/rest/v1/documentos_legales?select=id&id=eq.${documentId}`, {
    token: sessionA.access_token,
  });
  assert(publicDocuments.length === 1, 'Authenticated users must read active legal documents.');

  const firstAcceptance = await rpc(sessionA.access_token, 'aceptar_documento_legal', {
    p_documento_id: documentId,
    p_origen: 'configuracion',
  });
  const repeatedAcceptance = await rpc(sessionA.access_token, 'aceptar_documento_legal', {
    p_documento_id: documentId,
    p_origen: 'configuracion',
  });
  assert(firstAcceptance.id === repeatedAcceptance.id, 'Legal acceptance must be idempotent.');

  const acceptances = await rpc(sessionA.access_token, 'obtener_aceptaciones_legales');
  assert(
    acceptances.length === 1
      && acceptances[0].documento_id === documentId
      && acceptances[0].codigo === 'privacidad'
      && acceptances[0].version.startsWith('remote-smoke-')
      && acceptances[0].aceptado_at,
    'Legal acceptance must expose its active document metadata.',
  );

  await rpc(sessionA.access_token, 'registrar_dispositivo_notificacion', {
    p_onesignal_subscription_id: deviceId,
    p_plataforma: 'android',
    p_permiso_nativo: 'concedido',
  });
  await rpc(sessionB.access_token, 'registrar_dispositivo_notificacion', {
    p_onesignal_subscription_id: deviceId,
    p_plataforma: 'android',
    p_permiso_nativo: 'concedido',
  });
  const staleLogout = await rpc(sessionA.access_token, 'desvincular_dispositivo_notificacion', {
    p_onesignal_subscription_id: deviceId,
  });
  const ownerLogout = await rpc(sessionB.access_token, 'desvincular_dispositivo_notificacion', {
    p_onesignal_subscription_id: deviceId,
  });
  assert(staleLogout === false && ownerLogout === true, 'Device transfer must resist stale logout.');

  console.log('Remote privacy smoke test passed.');
} finally {
  if (userA) {
    await deleteUser(userA.id);
  }
  if (userB) {
    await deleteUser(userB.id);
  }
  if (documentId) {
    await request(`/rest/v1/documentos_legales?id=eq.${documentId}`, {
      key: secretKey,
      token: secretKey,
      method: 'DELETE',
    });
  }
}
