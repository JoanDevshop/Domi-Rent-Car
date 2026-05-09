-- ============================================================
-- Update storage policies para bucket 'domirentcar'
-- Pegar y ejecutar en Supabase Dashboard → SQL Editor
-- (esto reemplaza las policies viejas que apuntaban a 'vehicle-images')
-- ============================================================

-- Eliminar policies viejas
drop policy if exists vehicle_images_read on storage.objects;
drop policy if exists vehicle_images_insert_auth on storage.objects;
drop policy if exists vehicle_images_update_auth on storage.objects;
drop policy if exists vehicle_images_delete_auth on storage.objects;

-- Crear policies con bucket_id = 'domirentcar'
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
