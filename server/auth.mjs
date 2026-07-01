// Auth: PBKDF2 idéntico al del browser (WebCrypto) + token stateless HMAC.
import crypto from 'node:crypto';

const SECRET    = process.env.DOMI_AUTH_SECRET || 'dev-insecure-change-me';
const TOKEN_TTL = 60 * 60 * 24 * 30; // 30 días
const now       = () => Math.floor(Date.now() / 1000);

const b64  = (b) => Buffer.from(b).toString('base64');
const b64u = (b) => Buffer.from(b).toString('base64url');
const hmac = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');

// Mismo algoritmo/formato que el front: PBKDF2-SHA256, 100k iter, 32 bytes,
// salt 16 bytes, "<salt_b64>$<hash_b64>" en base64 estándar.
export function pbkdf2Hash(password, saltB64 = null) {
  const salt = saltB64 ? Buffer.from(saltB64, 'base64') : crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(Buffer.from(password, 'utf8'), salt, 100000, 32, 'sha256');
  return `${b64(salt)}$${b64(hash)}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes('$')) return false;
  const [saltB64] = stored.split('$');
  const a = Buffer.from(pbkdf2Hash(password, saltB64));
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function issueToken(uid) {
  const payload = b64u(JSON.stringify({ uid, exp: now() + TOKEN_TTL }));
  return `${payload}.${hmac(payload)}`;
}

// Devuelve { uid } o null. No toca DB.
export function verifyToken(token) {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || hmac(payload) !== sig) return null;
  let p; try { p = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
  return p.exp && p.exp >= now() ? p : null;
}
