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
// Storage: vehicle images
// ────────────────────────────────────────────────────────────
export async function uploadVehicleImage(file, vehicleId) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${vehicleId || 'tmp'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(VEHICLE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(VEHICLE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteVehicleImageByUrl(url) {
  // Saca el path después de '/storage/v1/object/public/<bucket>/'
  const marker = `/storage/v1/object/public/${VEHICLE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // URL externa (Unsplash), no borrar
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(VEHICLE_BUCKET).remove([path]);
}
