// One-shot: convierte las fotos JPEG/PNG que ya viven en /data/uploads a WebP
// (MISMA transformación que el upload: rotate + resize 1600 + webp q82),
// actualiza las URLs en la DB (vehicles.images + business_info.hero_image_url)
// y borra el original. Cambia la extensión (.jpg → .webp) = URL nueva, así el
// cache immutable de Cloudflare no sirve el JPEG viejo.
// Uso:  [DRY_RUN=1] node backfill-webp.mjs
import Database from 'better-sqlite3';
import sharp from 'sharp';
import { readFileSync, writeFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR   = process.env.DOMI_DATA_DIR || '/data';
const UPLOAD_DIR = join(DATA_DIR, 'uploads');
const DB_PATH    = join(DATA_DIR, 'domi.db');
const PUBLIC_URL = (process.env.PUBLIC_URL || 'https://api.domirentcar.com').replace(/\/$/, '');
const MARKER     = `${PUBLIC_URL}/uploads/`;
const DRY        = !!process.env.DRY_RUN;

const db = new Database(DB_PATH);
db.pragma('busy_timeout = 8000');

let count = 0, saved = 0;
async function convert(url) {
  if (typeof url !== 'string' || !url.startsWith(MARKER)) return url;   // externa → intacta
  if (!/\.(jpe?g|png)$/i.test(url)) return url;                         // ya webp / gif / video
  const rel = url.slice(MARKER.length).replace(/\.\./g, '');
  const abs = join(UPLOAD_DIR, rel);
  if (!existsSync(abs)) return url;                                     // no está en disco
  const newRel = rel.replace(/\.(jpe?g|png)$/i, '.webp');
  const newAbs = join(UPLOAD_DIR, newRel);
  const before = statSync(abs).size;
  const out = await sharp(readFileSync(abs)).rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 }).toBuffer();
  count++; saved += before - out.length;
  console.log(`${DRY ? '[dry] ' : ''}${rel}  ${(before/1024|0)}KB → ${(out.length/1024|0)}KB`);
  if (!DRY) { writeFileSync(newAbs, out); rmSync(abs); }
  return `${PUBLIC_URL}/uploads/${newRel}`;
}

// ── vehicles.images (JSON array) ──
for (const v of db.prepare('select id, images from vehicles').all()) {
  let imgs; try { imgs = JSON.parse(v.images || '[]'); } catch { imgs = []; }
  if (!Array.isArray(imgs) || !imgs.length) continue;
  const next = [];
  for (const u of imgs) next.push(await convert(u));
  if (!DRY && JSON.stringify(next) !== JSON.stringify(imgs))
    db.prepare("update vehicles set images=?, updated_at=datetime('now') where id=?").run(JSON.stringify(next), v.id);
}

// ── business_info.hero_image_url ──
const biz = db.prepare('select hero_image_url from business_info where id=1').get();
if (biz?.hero_image_url) {
  const nu = await convert(biz.hero_image_url);
  if (!DRY && nu !== biz.hero_image_url)
    db.prepare("update business_info set hero_image_url=?, updated_at=datetime('now') where id=1").run(nu);
}

console.log(`${DRY ? '[DRY] ' : ''}Convertidas ${count} fotos · ahorrado ${(saved/1024/1024).toFixed(1)}MB`);
