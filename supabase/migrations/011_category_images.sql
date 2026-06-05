-- =============================================================
-- Migration 011 — Category images
-- =============================================================
-- 1. Add image_url + image_alt to categories so each section can have a hero
--    image (USAHello-style cards on the Resources page).
-- 2. Create a public storage bucket 'category-images' for the uploads. Anyone
--    can read; only admins can write.

alter table categories add column if not exists image_url text;
alter table categories add column if not exists image_alt text;

-- ---------- Storage bucket ----------
insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do nothing;

-- ---------- Bucket policies ----------
-- Public read so the <img src> works without auth.
drop policy if exists "public read category images" on storage.objects;
create policy "public read category images"
on storage.objects for select
using (bucket_id = 'category-images');

-- Only admins can upload / update / delete.
drop policy if exists "admin write category images" on storage.objects;
create policy "admin write category images"
on storage.objects for insert
with check (
  bucket_id = 'category-images'
  and exists (
    select 1 from profiles p where p.id = auth.uid() and p.is_admin = true
  )
);

drop policy if exists "admin update category images" on storage.objects;
create policy "admin update category images"
on storage.objects for update
using (
  bucket_id = 'category-images'
  and exists (
    select 1 from profiles p where p.id = auth.uid() and p.is_admin = true
  )
);

drop policy if exists "admin delete category images" on storage.objects;
create policy "admin delete category images"
on storage.objects for delete
using (
  bucket_id = 'category-images'
  and exists (
    select 1 from profiles p where p.id = auth.uid() and p.is_admin = true
  )
);