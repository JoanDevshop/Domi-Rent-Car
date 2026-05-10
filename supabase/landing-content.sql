-- ============================================================
-- Extender business_info con contenido editable de la landing
-- Pegar TODO en Supabase SQL Editor → Run
--
-- Robusto: cada ALTER es independiente (idempotente con IF NOT
-- EXISTS), y el backfill de defaults va en un UPDATE separado
-- usando dollar-quoting ($$...$$) para evitar problemas con
-- apóstrofes, em-dash, acentos y JSON.
-- ============================================================

-- ─── 1. Agregar columnas (sin defaults, idempotente) ─────────
alter table public.business_info add column if not exists hero_eyebrow    text;
alter table public.business_info add column if not exists hero_subtitle   text;
alter table public.business_info add column if not exists hero_image_url  text;
alter table public.business_info add column if not exists cta_title       text;
alter table public.business_info add column if not exists cta_subtitle    text;
alter table public.business_info add column if not exists about_title     text;
alter table public.business_info add column if not exists about_subtitle  text;
alter table public.business_info add column if not exists about_mission   text;
alter table public.business_info add column if not exists perks           jsonb;

-- ─── 2. Backfill: llenar defaults solo si están null ─────────
update public.business_info
set
  hero_eyebrow   = coalesce(hero_eyebrow,   $$RENT A CAR · REPÚBLICA DOMINICANA$$),
  hero_subtitle  = coalesce(hero_subtitle,  $$Flota premium para negocios y placer. Reserva directo por WhatsApp en minutos, entrega a domicilio disponible.$$),
  hero_image_url = coalesce(hero_image_url, $$https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2400&q=80$$),
  cta_title      = coalesce(cta_title,      $$¿LISTO PARA ARRANCAR?$$),
  cta_subtitle   = coalesce(cta_subtitle,   $$Reserva tu vehículo ahora por WhatsApp. Sin formularios, sin esperas — respuesta inmediata.$$),
  about_title    = coalesce(about_title,    $$Tu socio de confianza$$),
  about_subtitle = coalesce(about_subtitle, $$Somos la rent car preferida en República Dominicana, con la flota más exclusiva y el mejor servicio personalizado.$$),
  about_mission  = coalesce(about_mission,  $$Ofrecer una experiencia de movilidad premium, segura y sin complicaciones. Vehículos modernos, precios justos y atención humana 24/7.$$),
  perks          = coalesce(perks,          $$[
    {"icon":"shield","title":"100% Asegurado","sub":"Cobertura total incluida en cada renta"},
    {"icon":"bolt","title":"Entrega Rápida","sub":"Tu vehículo listo en menos de 2 horas"},
    {"icon":"award","title":"Flota Premium","sub":"Vehículos modelo 2023+ en perfecto estado"},
    {"icon":"phone","title":"Soporte 24/7","sub":"WhatsApp directo, respuesta inmediata"}
  ]$$::jsonb)
where id = 1;

-- ─── 3. Verificación rápida ──────────────────────────────────
-- Si todo salió bien, esta query devuelve 1 fila con todos los campos llenos.
select
  name,
  hero_eyebrow,
  cta_title,
  about_title,
  jsonb_array_length(perks) as num_perks
from public.business_info
where id = 1;
