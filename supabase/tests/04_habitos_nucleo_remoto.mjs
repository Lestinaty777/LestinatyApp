import { existsSync, readFileSync } from 'node:fs';

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
const secretKey = env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) throw new Error('Missing Supabase URL or secret key in .env.local/.env.');

for (const tabla of ['habitos_items', 'habitos_planes', 'habitos_registros', 'habitos_contextos', 'habitos_registro_contextos', 'habitos_conexiones']) {
  const response = await fetch(`${url}/rest/v1/${tabla}?select=*&limit=1`, { headers: { apikey: secretKey, authorization: `Bearer ${secretKey}` } });
  if (!response.ok) throw new Error(`Missing or inaccessible table ${tabla} (${response.status}).`);
}

const rpc = await fetch(`${url}/rest/v1/rpc/obtener_panel_habitos`, { method: 'POST', headers: { apikey: secretKey, authorization: `Bearer ${secretKey}`, 'content-type': 'application/json' }, body: '{}' });
if (rpc.status === 404) throw new Error('Missing obtener_panel_habitos RPC.');
console.log('Remote habits core schema smoke test passed.');
