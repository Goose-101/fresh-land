-- Allow any signed-in user to read profiles so the community feed can show
-- the poster's full name. The existing "own profile" policy still controls
-- inserts/updates/deletes — only the owner can change their own row.

drop policy if exists "auth read profiles" on profiles;
create policy "auth read profiles" on profiles for select using (auth.role() = 'authenticated');