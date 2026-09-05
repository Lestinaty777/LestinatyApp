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

if (!url || !secretKey) {
  throw new Error('Missing Supabase URL or secret key in .env.local/.env.');
}

const tablas = [
  'metas',
  'senderos',
  'sendero_niveles',
  'sendero_nodos',
  'sendero_conexiones',
  'sendero_cofres',
  'aby_propuestas',
  'aby_generation_locks',
];

for (const tabla of tablas) {
  const response = await fetch(`${url}/rest/v1/${tabla}?select=*&limit=1`, {
    headers: {
      apikey: secretKey,
      authorization: `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Missing or inaccessible table ${tabla} (${response.status}).`);
  }
}

console.log('Remote senderos core schema smoke test passed.');
