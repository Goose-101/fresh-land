-- Community v2: photo posts, resource tagging, auto-approve with report-based auto-hide.
-- Run this in the Supabase SQL editor.

-- ---------- community_posts additions ----------
alter table community_posts add column if not exists image_url text;
alter table community_posts add column if not exists resource_id uuid references resources(id) on delete set null;
alter table community_posts add column if not exists report_count integer default 0;
alter table community_posts alter column is_approved set default true;
alter table community_posts alter column title drop not null;

-- Backfill: existing posts stay visible (schema.sql had is_approved default false for old pre-mod flow).
update community_posts set is_approved = true where is_approved is null;

-- ---------- community_replies: auto-approve ----------
alter table community_replies alter column is_approved set default true;
alter table community_replies add column if not exists report_count integer default 0;
update community_replies set is_approved = true where is_approved is null;

-- ---------- profiles: blocked flag ----------
alter table profiles add column if not exists is_blocked boolean default false;

-- ---------- community_reports ----------
create table if not exists community_reports (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references community_posts(id) on delete cascade,
  reply_id uuid references community_replies(id) on delete cascade,
  reporter_id uuid references profiles(id) on delete set null,
  reason text not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists community_reports_post_idx on community_reports(post_id);
create index if not exists community_reports_reply_idx on community_reports(reply_id);

alter table community_reports enable row level security;

drop policy if exists "insert own report" on community_reports;
create policy "insert own report" on community_reports for insert with check (auth.uid() = reporter_id);

drop policy if exists "admin read reports" on community_reports;
create policy "admin read reports" on community_reports for select using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ---------- auto-hide trigger ----------
-- When a post accumulates 3+ reports, hide it from the public feed until an admin reviews.
create or replace function handle_community_report()
returns trigger as $$
declare
  post_reports integer;
  reply_reports integer;
begin
  if new.post_id is not null then
    update community_posts
      set report_count = coalesce(report_count, 0) + 1
      where id = new.post_id
      returning report_count into post_reports;
    if post_reports >= 3 then
      update community_posts set is_approved = false where id = new.post_id;
    end if;
  end if;
  if new.reply_id is not null then
    update community_replies
      set report_count = coalesce(report_count, 0) + 1
      where id = new.reply_id
      returning report_count into reply_reports;
    if reply_reports >= 3 then
      update community_replies set is_approved = false where id = new.reply_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_community_report on community_reports;
create trigger on_community_report
  after insert on community_reports
  for each row execute procedure handle_community_report();

-- ---------- RLS: block posts from blocked users ----------
drop policy if exists "insert own post" on community_posts;
create policy "insert own post" on community_posts for insert with check (
  auth.uid() = user_id
  and not exists (select 1 from profiles where id = auth.uid() and is_blocked = true)
);

drop policy if exists "insert own reply" on community_replies;
create policy "insert own reply" on community_replies for insert with check (
  auth.uid() = user_id
  and not exists (select 1 from profiles where id = auth.uid() and is_blocked = true)
);

-- ---------- Storage bucket for community photos ----------
-- Run this once; Supabase will no-op if bucket exists.
insert into storage.buckets (id, name, public)
values ('community-photos', 'community-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read community photos" on storage.objects;
create policy "public read community photos" on storage.objects for select
  using (bucket_id = 'community-photos');

drop policy if exists "auth upload community photos" on storage.objects;
create policy "auth upload community photos" on storage.objects for insert
  with check (bucket_id = 'community-photos' and auth.role() = 'authenticated');

drop policy if exists "own delete community photos" on storage.objects;
create policy "own delete community photos" on storage.objects for delete
  using (bucket_id = 'community-photos' and owner = auth.uid());