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
// `SUPABASE_ACESSS_TOKEN` (tres S) es un typo histórico del .env de este
// proyecto — se admite también el nombre correcto.
const token = env.SUPABASE_ACCESS_TOKEN ?? env.SUPABASE_ACESSS_TOKEN;
const sqlPath = process.argv[2];

if (!url) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL in .env.local/.env.');
if (!token) throw new Error('Missing SUPABASE_ACCESS_TOKEN (or SUPABASE_ACESSS_TOKEN) in .env.local/.env.');
if (!sqlPath) throw new Error('Usage: node ejecutar_sql_management.mjs <ruta-al-sql>');

const projectRef = new URL(url).hostname.split('.')[0];
const query = readFileSync(sqlPath, 'utf8');

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({ query }),
});

const text = await response.text();

if (!response.ok) {
  console.error(`HTTP ${response.status}: ${text}`);
  process.exit(1);
}

console.log(text);
