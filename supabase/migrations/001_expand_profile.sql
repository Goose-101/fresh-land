-- Adds extended profile fields for settings panel
-- Safe to run multiple times (uses IF NOT EXISTS).

alter table profiles add column if not exists preferred_name text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists phone_sms_opt_in boolean default false;
alter table profiles add column if not exists household_size integer;
alter table profiles add column if not exists children_count integer;
alter table profiles add column if not exists country_of_origin text;
alter table profiles add column if not exists languages_spoken text[] default '{}';
alter table profiles add column if not exists theme text default 'system';
alter table profiles add column if not exists notification_prefs jsonb default '{}'::jsonb;
alter table profiles add column if not exists privacy_prefs jsonb default '{}'::jsonb;
alter table profiles add column if not exists emergency_contact jsonb;
alter table profiles add column if not exists is_paused boolean default false;