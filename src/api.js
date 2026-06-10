import { supabase } from './supabase';

const VEHICLE_BUCKET = 'domirentcar';

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

// ────────────────────────────────────────────────────────────
// Vehicles
// ────────────────────────────────────────────────────────────
export async function fetchVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(vehicleFromRow);
}

export async function upsertVehicle(v) {
  const row = vehicleToRow(v);
  const { data, error } = await supabase
    .from('vehicles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return vehicleFromRow(data);
}

export async function deleteVehicle(id) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

export async function setVehicleAvailability(id, available) {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ available })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return vehicleFromRow(data);
}

// ────────────────────────────────────────────────────────────
// Business info (singleton)
// ────────────────────────────────────────────────────────────
export async function fetchBusinessInfo() {
  const { data, error } = await supabase
    .from('business_info')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return businessFromRow(data);
}

export async function updateBusinessInfo(b) {
  const row = businessToRow(b);
  const { data, error } = await supabase
    .from('business_info')
    .update(row)
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return businessFromRow(data);
}

// ────────────────────────────────────────────────────────────
// Password hashing — PBKDF2-SHA256, 100000 iter, 32 bytes output
// Format en DB: "<salt_b64>$<hash_b64>"
// ────────────────────────────────────────────────────────────
const PBKDF2_ITER = 100000;

const u8ToB64 = (u8) => btoa(String.fromCharCode(...u8));
const b64ToU8 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function hashPassword(password, saltB64 = null) {
  const enc = new TextEncoder();
  const saltBytes = saltB64
    ? b64ToU8(saltB64)
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    key, 256
  );
  return `${u8ToB64(saltBytes)}$${u8ToB64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes('$')) return false;
  const [saltB64] = storedHash.split('$');
  const reHashed = await hashPassword(password, saltB64);
  return reHashed === storedHash;
}

// ────────────────────────────────────────────────────────────
// App users (admin del sistema, con roles)
// ────────────────────────────────────────────────────────────
const userFromRow = (r) => ({
  id: r.id,
  name: r.name,
  role: r.role,
  passwordHash: r.password_hash,
  createdAt: r.created_at,
});

export async function fetchAppUsers() {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(userFromRow);
}

export async function fetchAppUsersForLogin() {
  // Solo lo que necesitamos para verificar password (sin metadata pesada)
  const { data, error } = await supabase
    .from('app_users')
    .select('id, name, role, password_hash');
  if (error) throw error;
  return (data || []).map(userFromRow);
}

export async function createAppUser({ name, password, role }) {
  const password_hash = await hashPassword(password);
  const { data, error } = await supabase
    .from('app_users')
    .insert({ name, password_hash, role })
    .select()
    .single();
  if (error) throw error;
  return userFromRow(data);
}

export async function updateAppUser(id, { name, password, role }) {
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (role !== undefined) patch.role = role;
  if (password) patch.password_hash = await hashPassword(password);
  const { data, error } = await supabase
    .from('app_users')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return userFromRow(data);
}

export async function deleteAppUser(id) {
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// Sesión anónima — usada por el flujo admin con password local.
// Requiere habilitar "Anonymous sign-ins" en Supabase Auth → Settings.
export async function signInAnonymous() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null));
  return () => data.subscription.unsubscribe();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// ────────────────────────────────────────────────────────────
// Storage: uploads (genérico)
// ────────────────────────────────────────────────────────────
// Convierte imágenes a WebP y las redimensiona en el navegador antes
// de subir, para que el sitio cargue ligero. Los videos y GIF pasan
// sin tocar (GIF perdería la animación). Si algo falla, sube el original.
const MAX_IMG_DIM = 1600;   // lado mayor; suficiente para hero/galería
const WEBP_QUALITY = 0.82;  // buen balance peso/calidad

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
    if (!blob || blob.size >= file.size) return file; // no mejoró → original
    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file; // navegador viejo o decode falló → sube original
  }
}

// Sube cualquier archivo al bucket. `folder` define el prefix
// (ej. 'vehicles/<id>', 'hero', 'misc'). Acepta image/* y video/*.
export async function uploadImage(file, folder = 'misc') {
  file = await compressToWebp(file);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const safe = folder.replace(/[^a-z0-9/_-]/gi, '_');
  const path = `${safe}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(VEHICLE_BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(VEHICLE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Compatibilidad con código existente
export async function uploadVehicleImage(file, vehicleId) {
  return uploadImage(file, `vehicles/${vehicleId || 'tmp'}`);
}

export async function deleteImageByUrl(url) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${VEHICLE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // URL externa, no borrar
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(VEHICLE_BUCKET).remove([path]);
}

export const deleteVehicleImageByUrl = deleteImageByUrl; // alias retro
