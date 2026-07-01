// DOMI RENT CAR — backend self-host (Node + Fastify + SQLite + sharp)
// Espejo de src/api.js. Egress de fotos servido local (Cloudflare cachea).
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fstatic from '@fastify/static';
import Database from 'better-sqlite3';
import sharp from 'sharp';
import crypto from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pbkdf2Hash, verifyPassword, issueToken, verifyToken } from './auth.mjs';
import { initSchema } from './schema.mjs';

const DATA_DIR   = process.env.DOMI_DATA_DIR || '/data';
const UPLOAD_DIR = join(DATA_DIR, 'uploads');
const DB_PATH    = join(DATA_DIR, 'domi.db');
const PORT       = Number(process.env.PORT || 8080);
const PUBLIC_URL = (process.env.PUBLIC_URL || 'https://api.domirentcar.com').replace(/\/$/, '');

mkdirSync(UPLOAD_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
initSchema(db);

// Primer admin: si no hay usuarios y hay DOMI_ADMIN_PASSWORD → créalo.
if (process.env.DOMI_ADMIN_PASSWORD && db.prepare('select count(*) c from app_users').get().c === 0) {
  db.prepare('insert into app_users (id, name, password_hash, role) values (?,?,?,?)')
    .run(crypto.randomUUID(), 'Admin', pbkdf2Hash(process.env.DOMI_ADMIN_PASSWORD), 'owner');
  console.log('[seed] admin inicial creado');
}

// token → user (o null). Verificación de firma en auth.mjs; acá el lookup en DB.
function userFromToken(token) {
  const p = verifyToken(token);
  return p ? db.prepare('select id, name, role from app_users where id = ?').get(p.uid) || null : null;
}

const app = Fastify({ bodyLimit: 30 * 1024 * 1024 });
await app.register(cors, { origin: [/^https:\/\/([a-z0-9-]+\.)*domirentcar\.com$/] }); // apex + www + subdominios
await app.register(multipart, { limits: { fileSize: 60 * 1024 * 1024 } });
await app.register(fstatic, {
  root: UPLOAD_DIR, prefix: '/uploads/',
  setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'),
});

// Bearer → req.user (null si inválido). Guard aparte para rutas de escritura.
app.decorateRequest('user', null);
app.addHook('onRequest', async (req) => {
  const h = req.headers.authorization || '';
  req.user = userFromToken(h.startsWith('Bearer ') ? h.slice(7) : null);
});
const requireAuth = async (req, reply) => { if (!req.user) return reply.code(401).send({ error: 'no autorizado' }); };

// ── Mappers: SQLite guarda images/perks como TEXT json; front espera array ──
const outVehicle = (r) => r && ({ ...r, images: JSON.parse(r.images || '[]') });
const inVehicle  = (v) => ({
  id: v.id, name: v.name, category: v.category, year: v.year, price_per_day: v.price_per_day,
  transmission: v.transmission, fuel: v.fuel, seats: v.seats, doors: v.doors, luggage: v.luggage,
  ac: v.ac ? 1 : 0, bluetooth: v.bluetooth ? 1 : 0, gps: v.gps ? 1 : 0, power: v.power,
  engine: v.engine, color: v.color, plate: v.plate, available: v.available ? 1 : 0,
  featured: v.featured ? 1 : 0, description: v.description,
  images: JSON.stringify(v.images ?? []), sort_order: v.sort_order ?? 0,
});
const outBusiness = (r) => r && ({ ...r, perks: JSON.parse(r.perks || '[]') });

// ──────────────────────── Vehicles ────────────────────────
app.get('/api/vehicles', () =>
  db.prepare('select * from vehicles order by sort_order asc, created_at asc').all().map(outVehicle));

app.put('/api/vehicles', { preHandler: requireAuth }, async (req) => {
  const row = inVehicle(req.body);
  const cols = Object.keys(row);
  db.prepare(
    `insert into vehicles (${cols.join(',')}) values (${cols.map(c => '@' + c).join(',')})
     on conflict(id) do update set ${cols.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(',')},
     updated_at=datetime('now')`
  ).run(row);
  return outVehicle(db.prepare('select * from vehicles where id=?').get(row.id));
});

app.delete('/api/vehicles/:id', { preHandler: requireAuth }, async (req) => {
  db.prepare('delete from vehicles where id=?').run(req.params.id);
  return { ok: true };
});

app.patch('/api/vehicles/:id/availability', { preHandler: requireAuth }, async (req) => {
  db.prepare("update vehicles set available=?, updated_at=datetime('now') where id=?")
    .run(req.body.available ? 1 : 0, req.params.id);
  return outVehicle(db.prepare('select * from vehicles where id=?').get(req.params.id));
});

// ──────────────────────── Business info (singleton id=1) ────────────────────────
app.get('/api/business-info', () =>
  outBusiness(db.prepare('select * from business_info where id=1').get()));

app.put('/api/business-info', { preHandler: requireAuth }, async (req) => {
  const b = req.body, keys = [
    'name','tagline','phone','whatsapp','email','address','hours','instagram',
    'years_in_business','happy_clients','rating','hero_eyebrow','hero_subtitle','hero_image_url',
    'cta_title','cta_subtitle','about_title','about_subtitle','about_mission',
  ];
  const patch = {}; for (const k of keys) if (k in b) patch[k] = b[k];
  patch.perks = JSON.stringify(b.perks ?? []);
  const set = Object.keys(patch).map(k => `${k}=@${k}`).join(',');
  db.prepare(`update business_info set ${set}, updated_at=datetime('now') where id=1`).run(patch);
  return outBusiness(db.prepare('select * from business_info where id=1').get());
});

// ──────────────────────── Auth + app_users ────────────────────────
app.post('/api/login', async (req, reply) => {
  const { password } = req.body || {};
  const users = db.prepare('select id, password_hash from app_users').all();
  const hit = users.find(u => verifyPassword(password, u.password_hash));
  if (!hit) return reply.code(401).send({ error: 'Contraseña incorrecta' });
  const u = db.prepare('select id, name, role from app_users where id=?').get(hit.id);
  return { token: issueToken(u.id), user: u };
});

app.get('/api/me', async (req, reply) =>
  req.user ? req.user : reply.code(401).send({ error: 'no autorizado' }));

app.get('/api/app-users', { preHandler: requireAuth }, () =>
  db.prepare('select id, name, role, created_at from app_users order by created_at asc').all());

app.post('/api/app-users', { preHandler: requireAuth }, async (req) => {
  const { name, password, role } = req.body;
  const id = crypto.randomUUID();
  db.prepare('insert into app_users (id, name, password_hash, role) values (?,?,?,?)')
    .run(id, name, pbkdf2Hash(password), role);
  return db.prepare('select id, name, role, created_at from app_users where id=?').get(id);
});

app.patch('/api/app-users/:id', { preHandler: requireAuth }, async (req) => {
  const { name, password, role } = req.body;
  if (name !== undefined) db.prepare('update app_users set name=? where id=?').run(name, req.params.id);
  if (role !== undefined) db.prepare('update app_users set role=? where id=?').run(role, req.params.id);
  if (password) db.prepare('update app_users set password_hash=? where id=?').run(pbkdf2Hash(password), req.params.id);
  return db.prepare('select id, name, role, created_at from app_users where id=?').get(req.params.id);
});

app.delete('/api/app-users/:id', { preHandler: requireAuth }, async (req) => {
  db.prepare('delete from app_users where id=?').run(req.params.id);
  return { ok: true };
});

// ──────────────────────── Uploads (sharp → webp) ────────────────────────
const RAW = new Set(['image/gif']); // gif y video pasan sin tocar
app.post('/api/upload', { preHandler: requireAuth }, async (req, reply) => {
  const part = await req.file();
  if (!part) return reply.code(400).send({ error: 'sin archivo' });
  const folder = (part.fields?.folder?.value || 'misc').replace(/[^a-z0-9/_-]/gi, '_');
  const buf = await part.toBuffer();
  const isImg = part.mimetype?.startsWith('image/') && !RAW.has(part.mimetype);
  let out = buf, ext = (part.filename.split('.').pop() || 'bin').toLowerCase();
  if (isImg) {
    out = await sharp(buf).rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
    ext = 'webp';
  }
  const rel = `${folder}/${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
  const abs = join(UPLOAD_DIR, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, out);
  return { url: `${PUBLIC_URL}/uploads/${rel}` };
});

app.delete('/api/upload', { preHandler: requireAuth }, async (req) => {
  const url = req.body?.url || '';
  const marker = `${PUBLIC_URL}/uploads/`;
  if (!url.startsWith(marker)) return { ok: true }; // externa → no tocar
  const rel = url.slice(marker.length).replace(/\.\./g, '');
  const abs = join(UPLOAD_DIR, rel);
  if (existsSync(abs)) rmSync(abs);
  return { ok: true };
});

app.get('/api/health', () => ({ ok: true, vehicles: db.prepare('select count(*) c from vehicles').get().c }));

app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`domi_api on :${PORT}`))
  .catch((e) => { app.log.error(e); process.exit(1); });
