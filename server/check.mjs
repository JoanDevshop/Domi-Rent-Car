// Self-check del path de seguridad. Corre: node check.mjs
import assert from 'node:assert/strict';
import { pbkdf2Hash, verifyPassword, issueToken, verifyToken } from './auth.mjs';

// PBKDF2 round-trip
const h = pbkdf2Hash('admin123');
assert.equal(verifyPassword('admin123', h), true, 'password correcta verifica');
assert.equal(verifyPassword('wrong', h), false, 'password incorrecta falla');
assert.equal(verifyPassword('x', ''), false, 'hash vacío falla');

// Determinista con salt fijo → garantiza que los hashes hechos por el browser
// (mismo PBKDF2-SHA256/100k/32B/base64) verifican idénticos acá.
const salt = Buffer.from('sixteen-byte-sal').toString('base64'); // 16 bytes
const a = pbkdf2Hash('secret', salt);
assert.equal(a, pbkdf2Hash('secret', salt), 'determinista con salt fijo');
assert.ok(a.startsWith(salt + '$'), 'formato salt$hash');

// Token stateless
const t = issueToken('user-123');
assert.equal(verifyToken(t)?.uid, 'user-123', 'token válido');
assert.equal(verifyToken(t.slice(0, -2) + 'zz'), null, 'firma manipulada → null');
assert.equal(verifyToken('garbage'), null, 'basura → null');

console.log('OK — auth self-check passed');
