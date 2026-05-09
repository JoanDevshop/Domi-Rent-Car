-- ============================================================
-- DOMI RENT CAR — Schema inicial
-- Pegar y ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Tabla: vehicles
-- ────────────────────────────────────────────────────────────
create table if not exists public.vehicles (
  id            text primary key,
  name          text        not null,
  category      text        not null,
  year          integer     not null,
  price_per_day numeric     not null,
  transmission  text,
  fuel          text,
  seats         integer,
  doors         integer,
  luggage       integer,
  ac            boolean     default true,
  bluetooth     boolean     default true,
  gps           boolean     default false,
  power         text,
  engine        text,
  color         text,
  plate         text,
  available     boolean     default true,
  featured      boolean     default false,
  description   text,
  images        jsonb       default '[]'::jsonb,
  sort_order    integer     default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- Tabla: business_info (singleton — siempre 1 fila, id=1)
-- ────────────────────────────────────────────────────────────
create table if not exists public.business_info (
  id                 integer primary key default 1,
  name               text not null,
  tagline            text,
  phone              text,
  whatsapp           text,
  email              text,
  address            text,
  hours              text,
  instagram          text,
  years_in_business  integer default 0,
  happy_clients      integer default 0,
  rating             numeric default 5.0,
  updated_at         timestamptz default now(),
  constraint singleton check (id = 1)
);

-- Seed inicial (no falla si ya existe)
insert into public.business_info
  (id, name, tagline, phone, whatsapp, email, address, hours, instagram,
   years_in_business, happy_clients, rating)
values
  (1, 'DOMI RENT CAR', 'Maneja con estilo. Vive sin límites.',
   '+1 (809) 555-0199', '18095550199',
   'info@domirentcar.com', 'Av. Independencia #1234, Santo Domingo, RD',
   'Lun–Sab 8:00 AM – 8:00 PM · Dom 9:00 AM – 5:00 PM', '@domirentcar',
   12, 4800, 4.9)
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- Trigger: updated_at automático
-- ────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists vehicles_updated on public.vehicles;
create trigger vehicles_updated
  before update on public.vehicles
  for each row execute function public.set_updated_at();

drop trigger if exists business_updated on public.business_info;
create trigger business_updated
  before update on public.business_info
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- RLS — Row Level Security
-- Lectura: cualquiera (anon). Escritura: solo authenticated.
-- ────────────────────────────────────────────────────────────
alter table public.vehicles      enable row level security;
alter table public.business_info enable row level security;

-- vehicles
drop policy if exists vehicles_select_all on public.vehicles;
create policy vehicles_select_all on public.vehicles
  for select using (true);

drop policy if exists vehicles_insert_auth on public.vehicles;
create policy vehicles_insert_auth on public.vehicles
  for insert to authenticated with check (true);

drop policy if exists vehicles_update_auth on public.vehicles;
create policy vehicles_update_auth on public.vehicles
  for update to authenticated using (true) with check (true);

drop policy if exists vehicles_delete_auth on public.vehicles;
create policy vehicles_delete_auth on public.vehicles
  for delete to authenticated using (true);

-- business_info
drop policy if exists business_select_all on public.business_info;
create policy business_select_all on public.business_info
  for select using (true);

drop policy if exists business_update_auth on public.business_info;
create policy business_update_auth on public.business_info
  for update to authenticated using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- Storage: políticas para bucket 'domirentcar'
-- (crear el bucket primero desde Dashboard → Storage → New bucket,
--  marcado como Public)
-- ────────────────────────────────────────────────────────────
drop policy if exists vehicle_images_read on storage.objects;
drop policy if exists vehicle_images_insert_auth on storage.objects;
drop policy if exists vehicle_images_update_auth on storage.objects;
drop policy if exists vehicle_images_delete_auth on storage.objects;

drop policy if exists domirentcar_read on storage.objects;
create policy domirentcar_read on storage.objects
  for select using (bucket_id = 'domirentcar');

drop policy if exists domirentcar_insert_auth on storage.objects;
create policy domirentcar_insert_auth on storage.objects
  for insert to authenticated with check (bucket_id = 'domirentcar');

drop policy if exists domirentcar_update_auth on storage.objects;
create policy domirentcar_update_auth on storage.objects
  for update to authenticated using (bucket_id = 'domirentcar');

drop policy if exists domirentcar_delete_auth on storage.objects;
create policy domirentcar_delete_auth on storage.objects
  for delete to authenticated using (bucket_id = 'domirentcar');
