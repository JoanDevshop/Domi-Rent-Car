-- ============================================================
-- Sistema de usuarios del admin con roles
-- Pegar TODO en Supabase SQL Editor → Run
--
-- - Tabla app_users (sin email, login solo por contraseña)
-- - Hash PBKDF2 client-side; el password_hash format = "salt$hash" base64
-- - Roles: owner / manager / operator
-- - Owner inicial con clave "123admin" (cambialo desde el admin después)
-- ============================================================

-- ─── Tabla ───────────────────────────────────────────────────
create table if not exists public.app_users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  password_hash text not null,
  role          text not null
    check (role in ('owner', 'manager', 'operator'))
    default 'operator',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Trigger updated_at ──────────────────────────────────────
drop trigger if exists app_users_updated on public.app_users;
create trigger app_users_updated
  before update on public.app_users
  for each row execute function public.set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.app_users enable row level security;

-- Lectura: pública (la app necesita leer los hashes para verificar password
-- al login. los hashes están protegidos por PBKDF2, no son texto plano).
drop policy if exists app_users_select_public on public.app_users;
create policy app_users_select_public on public.app_users
  for select using (true);

-- Escritura: solo authenticated (= cualquier user logueado puede CRUD).
-- La validación granular por rol "owner" se hace en el frontend.
-- Para producción más estricta, crear una RPC SECURITY DEFINER que valide
-- el rol del caller — para v1 esto es suficiente.
drop policy if exists app_users_insert_auth on public.app_users;
create policy app_users_insert_auth on public.app_users
  for insert to authenticated with check (true);

drop policy if exists app_users_update_auth on public.app_users;
create policy app_users_update_auth on public.app_users
  for update to authenticated using (true) with check (true);

drop policy if exists app_users_delete_auth on public.app_users;
create policy app_users_delete_auth on public.app_users
  for delete to authenticated using (true);

-- ─── Owner inicial con clave "laboratorio53" ─────────────────
-- Hash PBKDF2-SHA256, 100000 iteraciones, output 32 bytes.
-- Formato: <salt_b64>$<hash_b64>
-- Salt raw: "DemoSalt_Domi01"
-- Hash calculado en Python con hashlib.pbkdf2_hmac
insert into public.app_users (id, name, password_hash, role)
values (
  '00000000-0000-0000-0000-000000000001',
  'Admin',
  'RGVtb1NhbHRfRG9taTAx$Fem3ZGt74nn/i9EJfWMTqcZXR4py9QRBAACGWhlHt6Y=',
  'owner'
)
on conflict (id) do nothing;

-- ─── Verificación ────────────────────────────────────────────
select id, name, role, created_at from public.app_users order by created_at;
