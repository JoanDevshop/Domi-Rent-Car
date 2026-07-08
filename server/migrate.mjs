// One-shot: extrae Supabase → SQLite + baja fotos a /data/uploads.
// Uso:  SUPABASE_SERVICE_KEY=xxx  DOMI_DATA_DIR=./data  node migrate.mjs
// Baja fotos por el endpoint AUTENTICADO (no /public/) que no cuenta como
// "cached egress" — así esquiva la restricción del Free tier.
import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { initSchema } from './schema.mjs';

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://bwbtgivbpmkdaoruciaa.supabase.co').replace(/\/$/, '');
const KEY          = process.env.SUPABASE_SERVICE_KEY;
const PUBLIC_URL   = (process.env.PUBLIC_URL || 'https://api.domirentcar.com').replace(/\/$/, '');
const DATA_DIR     = process.env.DOMI_DATA_DIR || './data';
const UPLOAD_DIR   = join(DATA_DIR, 'uploads');
const BUCKET       = 'domirentcar';
if (!KEY) { console.error('Falta SUPABASE_SERVICE_KEY'); process.exit(1); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const rest = async (t) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*`, { headers: H });
  if (!r.ok) throw new Error(`REST ${t} → ${r.status} ${await r.text()}`);
  return r.json();
};

const PUB_MARKER = `/storage/v1/object/public/${BUCKET}/`;
const failed = [];
async function localizeUrl(url) {
  if (typeof url !== 'string' || !url.includes(PUB_MARKER)) return url; // externa → intacta
  const rel = url.slice(url.indexOf(PUB_MARKER) + PUB_MARKER.length);
  const abs = join(UPLOAD_DIR, rel);
  // endpoint autenticado primero (no cached), luego el público como fallback
  for (const u of [`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${rel}`, url]) {
    try {
      const r = await fetch(u, { headers: H });
      if (!r.ok) continue;
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, Buffer.from(await r.arrayBuffer()));
      return `${PUBLIC_URL}/uploads/${rel}`;
    } catch { /* siguiente */ }
  }
  failed.push(rel);
  return url; // no se pudo bajar → deja la URL vieja para no perder el registro
}

const db = new Database(join(DATA_DIR, 'domi.db'));
db.pragma('journal_mode = WAL');
initSchema(db);

// ── vehicles ──
const vehicles = await rest('vehicles');
for (const v of vehicles) {
  const imgs = Array.isArray(v.images) ? v.images : [];
  v.images = [];
  for (const im of imgs) v.images.push(await localizeUrl(im));
  const cols = Object.keys(v);
  const row = { ...v, images: JSON.stringify(v.images) };
  for (const k of cols) if (typeof row[k] === 'boolean') row[k] = row[k] ? 1 : 0; // better-sqlite3 no bindea booleans
  db.prepare(
    `insert into vehicles (${cols.join(',')}) values (${cols.map(c => '@' + c).join(',')})
     on conflict(id) do update set ${cols.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(',')}`
  ).run(row);
}

// ── business_info (singleton) ──
const [biz] = await rest('business_info');
if (biz) {
  if (biz.hero_image_url) biz.hero_image_url = await localizeUrl(biz.hero_image_url);
  if (Array.isArray(biz.perks)) biz.perks = JSON.stringify(biz.perks);
  const cols = Object.keys(biz);
  db.prepare(
    `insert into business_info (${cols.join(',')}) values (${cols.map(c => '@' + c).join(',')})
     on conflict(id) do update set ${cols.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(',')}`
  ).run(biz);
}

// ── app_users (hashes PBKDF2 se copian tal cual → login sigue funcionando) ──
const users = await rest('app_users');
for (const u of users) {
  db.prepare('insert or replace into app_users (id, name, password_hash, role, created_at) values (?,?,?,?,?)')
    .run(u.id, u.name, u.password_hash, u.role, u.created_at || null);
}

console.log(`OK — vehicles:${vehicles.length} business:${biz ? 1 : 0} users:${users.length}`);
if (failed.length) console.warn(`⚠ ${failed.length} fotos NO bajaron (egress bloqueado):\n  ${failed.join('\n  ')}`);
else console.log('Todas las fotos bajaron ✓');
