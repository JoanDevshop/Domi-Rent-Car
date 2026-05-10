-- ============================================================
-- Extender business_info con contenido editable de la landing
-- Pegar en Supabase SQL Editor → Run
-- ============================================================

alter table public.business_info
  add column if not exists hero_eyebrow text
    default 'RENT A CAR · REPÚBLICA DOMINICANA',
  add column if not exists hero_subtitle text
    default 'Flota premium para negocios y placer. Reserva directo por WhatsApp en minutos, entrega a domicilio disponible.',
  add column if not exists hero_image_url text
    default 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2400&q=80',
  add column if not exists cta_title text
    default '¿LISTO PARA ARRANCAR?',
  add column if not exists cta_subtitle text
    default 'Reserva tu vehículo ahora por WhatsApp. Sin formularios, sin esperas — respuesta inmediata.',
  add column if not exists about_title text
    default 'Tu socio de confianza',
  add column if not exists about_subtitle text
    default 'Somos la rent car preferida en República Dominicana, con la flota más exclusiva y el mejor servicio personalizado.',
  add column if not exists about_mission text
    default 'Ofrecer una experiencia de movilidad premium, segura y sin complicaciones. Vehículos modernos, precios justos y atención humana 24/7.',
  add column if not exists perks jsonb
    default '[
      {"icon":"shield","title":"100% Asegurado","sub":"Cobertura total incluida en cada renta"},
      {"icon":"bolt","title":"Entrega Rápida","sub":"Tu vehículo listo en menos de 2 horas"},
      {"icon":"award","title":"Flota Premium","sub":"Vehículos modelo 2023+ en perfecto estado"},
      {"icon":"phone","title":"Soporte 24/7","sub":"WhatsApp directo, respuesta inmediata"}
    ]'::jsonb;

-- Backfill: si la fila id=1 ya existe pero los campos quedaron null
-- (solo si el default no se aplicó retroactivamente), forzar valores.
update public.business_info
set
  hero_eyebrow = coalesce(hero_eyebrow, 'RENT A CAR · REPÚBLICA DOMINICANA'),
  hero_subtitle = coalesce(hero_subtitle,
    'Flota premium para negocios y placer. Reserva directo por WhatsApp en minutos, entrega a domicilio disponible.'),
  hero_image_url = coalesce(hero_image_url,
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2400&q=80'),
  cta_title = coalesce(cta_title, '¿LISTO PARA ARRANCAR?'),
  cta_subtitle = coalesce(cta_subtitle,
    'Reserva tu vehículo ahora por WhatsApp. Sin formularios, sin esperas — respuesta inmediata.'),
  about_title = coalesce(about_title, 'Tu socio de confianza'),
  about_subtitle = coalesce(about_subtitle,
    'Somos la rent car preferida en República Dominicana, con la flota más exclusiva y el mejor servicio personalizado.'),
  about_mission = coalesce(about_mission,
    'Ofrecer una experiencia de movilidad premium, segura y sin complicaciones. Vehículos modernos, precios justos y atención humana 24/7.'),
  perks = coalesce(perks, '[
    {"icon":"shield","title":"100% Asegurado","sub":"Cobertura total incluida en cada renta"},
    {"icon":"bolt","title":"Entrega Rápida","sub":"Tu vehículo listo en menos de 2 horas"},
    {"icon":"award","title":"Flota Premium","sub":"Vehículos modelo 2023+ en perfecto estado"},
    {"icon":"phone","title":"Soporte 24/7","sub":"WhatsApp directo, respuesta inmediata"}
  ]'::jsonb)
where id = 1;
