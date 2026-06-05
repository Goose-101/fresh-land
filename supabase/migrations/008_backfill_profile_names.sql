-- Backfill profiles.full_name from auth.users metadata for any rows where it's
-- missing. Covers users who signed up before the trigger existed, or via OAuth
-- providers that use different metadata keys (Google sends `name`, Apple sends
-- `given_name` + `family_name`, etc.).
update profiles p
set full_name = coalesce(
  nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
  nullif(trim(
    concat_ws(' ',
      nullif(u.raw_user_meta_data ->> 'given_name', ''),
      nullif(u.raw_user_meta_data ->> 'family_name', '')
    )
  ), '')
)
from auth.users u
where p.id = u.id
  and (p.full_name is null or trim(p.full_name) = '')
  and u.raw_user_meta_data is not null;

-- Make the new-user trigger more permissive so future signups via any provider
-- still land with a name populated.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(
        concat_ws(' ',
          nullif(new.raw_user_meta_data ->> 'given_name', ''),
          nullif(new.raw_user_meta_data ->> 'family_name', '')
        )
      ), '')
    ),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;