// Cliente del backend self-host (api.domirentcar.com). Reemplaza Supabase.
const API = (import.meta.env.VITE_API_URL || 'https://api.domirentcar.com').replace(/\/$/, '');
const TOKEN_KEY = 'domi_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function req(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${getToken()}`;
  const r = await fetch(API + path, {
    method, headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `HTTP ${r.status}`);
  return r.status === 204 ? null : r.json();
}

// ────────────────────────────────────────────────────────────
// Mappers DB ↔ App  (snake_case ↔ camelCase)
// ────────────────────────────────────────────────────────────
const vehicleFromRow = (r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  year: r.year,
  pricePerDay: Number(r.price_per_day),
  transmission: r.transmission ?? 'Automática',
  fuel: r.fuel ?? 'Gasolina',
  seats: r.seats ?? 5,
  doors: r.doors ?? 4,
  luggage: r.luggage ?? 3,
  ac: !!r.ac,
  bluetooth: !!r.bluetooth,
  gps: !!r.gps,
  power: r.power ?? '',
  engine: r.engine ?? '',
  color: r.color ?? '',
  plate: r.plate ?? '',
  available: r.available ?? true,
  featured: !!r.featured,
  description: r.description ?? '',
  images: Array.isArray(r.images) ? r.images : [],
  sortOrder: r.sort_order ?? 0,
});

const vehicleToRow = (v) => ({
  id: v.id,
  name: v.name,
  category: v.category,
  year: v.year,
  price_per_day: v.pricePerDay,
  transmission: v.transmission,
  fuel: v.fuel,
  seats: v.seats,
  doors: v.doors,
  luggage: v.luggage,
  ac: v.ac,
  bluetooth: v.bluetooth,
  gps: v.gps,
  power: v.power,
  engine: v.engine,
  color: v.color,
  plate: v.plate,
  available: v.available,
  featured: v.featured,
  description: v.description,
  images: v.images ?? [],
  sort_order: v.sortOrder ?? 0,
});

const DEFAULT_PERKS_FALLBACK = [
  { icon: "shield", title: "100% Asegurado", sub: "Cobertura total incluida en cada renta" },
  { icon: "bolt",   title: "Entrega Rápida", sub: "Tu vehículo listo en menos de 2 horas" },
  { icon: "award",  title: "Flota Premium",  sub: "Vehículos modelo 2023+ en perfecto estado" },
  { icon: "phone",  title: "Soporte 24/7",   sub: "WhatsApp directo, respuesta inmediata" },
];

const businessFromRow = (r) => ({
  name: r.name,
  tagline: r.tagline ?? '',
  phone: r.phone ?? '',
  whatsapp: r.whatsapp ?? '',
  email: r.email ?? '',
  address: r.address ?? '',
  hours: r.hours ?? '',
  instagram: r.instagram ?? '',
  yearsInBusiness: r.years_in_business ?? 0,
  happyClients: r.happy_clients ?? 0,
  rating: Number(r.rating ?? 5),

  heroEyebrow: r.hero_eyebrow ?? '',
  heroSubtitle: r.hero_subtitle ?? '',
  heroImageUrl: r.hero_image_url ?? '',
  ctaTitle: r.cta_title ?? '',
  ctaSubtitle: r.cta_subtitle ?? '',
  aboutTitle: r.about_title ?? '',
  aboutSubtitle: r.about_subtitle ?? '',
  aboutMission: r.about_mission ?? '',
  perks: Array.isArray(r.perks) && r.perks.length ? r.perks : DEFAULT_PERKS_FALLBACK,
});

const businessToRow = (b) => ({
  name: b.name,
  tagline: b.tagline,
  phone: b.phone,
  whatsapp: b.whatsapp,
  email: b.email,
  address: b.address,
  hours: b.hours,
  instagram: b.instagram,
  years_in_business: b.yearsInBusiness,
  happy_clients: b.happyClients,
  rating: b.rating,

  hero_eyebrow: b.heroEyebrow,
  hero_subtitle: b.heroSubtitle,
  hero_image_url: b.heroImageUrl,
  cta_title: b.ctaTitle,
  cta_subtitle: b.ctaSubtitle,
  about_title: b.aboutTitle,
  about_subtitle: b.aboutSubtitle,
  about_mission: b.aboutMission,
  perks: b.perks ?? [],
});

const userFromRow = (r) => ({
  id: r.id,
  name: r.name,
  role: r.role,
  createdAt: r.created_at,
});

// ────────────────────────────────────────────────────────────
// Vehicles
// ────────────────────────────────────────────────────────────
export async function fetchVehicles() {
  return (await req('/api/vehicles')).map(vehicleFromRow);
}

export async function upsertVehicle(v) {
  return vehicleFromRow(await req('/api/vehicles', { method: 'PUT', body: vehicleToRow(v), auth: true }));
}

export async function deleteVehicle(id) {
  await req(`/api/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
}

export async function setVehicleAvailability(id, available) {
  return vehicleFromRow(
    await req(`/api/vehicles/${encodeURIComponent(id)}/availability`, { method: 'PATCH', body: { available }, auth: true })
  );
}

// ────────────────────────────────────────────────────────────
// Business info (singleton)
// ────────────────────────────────────────────────────────────
export async function fetchBusinessInfo() {
  return businessFromRow(await req('/api/business-info'));
}

export async function updateBusinessInfo(b) {
  return businessFromRow(await req('/api/business-info', { method: 'PUT', body: businessToRow(b), auth: true }));
}

// ────────────────────────────────────────────────────────────
// App users
// ────────────────────────────────────────────────────────────
export async function fetchAppUsers() {
  return (await req('/api/app-users', { auth: true })).map(userFromRow);
}

export async function createAppUser({ name, password, role }) {
  return userFromRow(await req('/api/app-users', { method: 'POST', body: { name, password, role }, auth: true }));
}

export async function updateAppUser(id, { name, password, role }) {
  return userFromRow(await req(`/api/app-users/${id}`, { method: 'PATCH', body: { name, password, role }, auth: true }));
}

export async function deleteAppUser(id) {
  await req(`/api/app-users/${id}`, { method: 'DELETE', auth: true });
}

// ────────────────────────────────────────────────────────────
// Auth — password verificado server-side, token propio en localStorage
// ────────────────────────────────────────────────────────────
export async function login(password) {
  const { token, user } = await req('/api/login', { method: 'POST', body: { password } });
  setToken(token);
  return { id: user.id, name: user.name, role: user.role };
}

export async function signOut() { setToken(null); }

export async function getCurrentUser() {
  if (!getToken()) return null;
  try { return await req('/api/me', { auth: true }); }
  catch { setToken(null); return null; }
}

// ────────────────────────────────────────────────────────────
// Uploads — compress a WebP en el browser + sharp de respaldo en el server
// ────────────────────────────────────────────────────────────
const MAX_IMG_DIM = 1600;   // lado mayor
const WEBP_QUALITY = 0.82;

async function compressToWebp(file) {
  if (!file.type?.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMG_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', WEBP_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file;
  }
}

// Sube al server. `folder` define el prefix (ej. 'vehicles/<id>', 'hero').
export async function uploadImage(file, folder = 'misc') {
  file = await compressToWebp(file);
  const fd = new FormData();
  fd.append('folder', folder);            // debe ir ANTES del file (parseo por stream)
  fd.append('file', file, file.name);
  const r = await fetch(API + '/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `HTTP ${r.status}`);
  return (await r.json()).url;
}

export async function uploadVehicleImage(file, vehicleId) {
  return uploadImage(file, `vehicles/${vehicleId || 'tmp'}`);
}

export async function deleteImageByUrl(url) {
  if (!url) return;
  await req('/api/upload', { method: 'DELETE', body: { url }, auth: true }).catch(() => {});
}

export const deleteVehicleImageByUrl = deleteImageByUrl; // alias retro
