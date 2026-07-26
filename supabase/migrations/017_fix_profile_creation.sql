-- Fix profile creation for new signups + backfill missing profiles.
--
-- Root cause: profiles were being created only by a client-side "self-heal"
-- in the app, which runs when a user logs in and loads the app. Users who
-- signed up but never fully logged in never got a profiles row. The
-- server-side trigger that should create profiles for everyone was not active
-- on the production database. This migration makes the trigger authoritative
-- and idempotent, then backfills every auth user that is missing a profile.

-- Robust, idempotent trigger: creates a profile on every new auth user, and
-- never blocks signup even if the insert hits an unexpected error.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Backfill: create a profile for every existing auth user that lacks one.
insert into profiles (id, full_name, email, avatar_url)
select
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.email,
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;
