-- Fresh Land — Supabase schema
-- Run this in the Supabase SQL editor once for a fresh project.

create extension if not exists "uuid-ossp";

-- =====================
-- Profiles
-- =====================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  preferred_language text default 'en',
  city text default 'Atlanta',
  state text default 'GA',
  zip text,
  needs text[] default '{}',
  immigration_status text,
  has_children boolean default false,
  english_comfort text default 'comfortable',
  years_in_us integer,
  is_admin boolean default false,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- Categories
-- =====================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  color text,
  display_order integer default 0,
  is_active boolean default true
);

-- =====================
-- Resources
-- =====================
create table if not exists resources (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  short_description text,
  category_id uuid references categories(id),
  subcategory text,
  website_url text,
  phone text,
  email text,
  address text,
  city text default 'Atlanta',
  state text default 'GA',
  zip text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  google_place_id text,
  google_rating numeric(3,1),
  google_review_count integer,
  google_photos text[],
  languages text[] default '{en}',
  is_free boolean default true,
  cost_description text,
  serves_undocumented boolean default true,
  documentation_required text[],
  hours text,
  hours_structured jsonb,
  eligibility text,
  how_to_apply text,
  what_to_bring text,
  walk_in_available boolean default false,
  weekend_hours boolean default false,
  evening_hours boolean default false,
  phone_intake boolean default true,
  is_active boolean default true,
  is_verified boolean default false,
  is_featured boolean default false,
  click_count integer default 0,
  save_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- Pathways
-- =====================
create table if not exists pathways (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id),
  title text not null,
  description text,
  estimated_time text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists pathway_steps (
  id uuid primary key default uuid_generate_v4(),
  pathway_id uuid references pathways(id) on delete cascade,
  step_number integer not null,
  title text not null,
  description text not null,
  tips text,
  warning text,
  is_optional boolean default false
);

create table if not exists pathway_step_resources (
  id uuid primary key default uuid_generate_v4(),
  step_id uuid references pathway_steps(id) on delete cascade,
  resource_id uuid references resources(id) on delete cascade
);

create table if not exists user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  pathway_id uuid references pathways(id) on delete cascade,
  step_id uuid references pathway_steps(id) on delete cascade,
  completed_at timestamptz,
  notes text,
  unique(user_id, step_id)
);

-- =====================
-- Saved resources
-- =====================
create table if not exists saved_resources (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  resource_id uuid references resources(id) on delete cascade,
  notes text,
  saved_at timestamptz default now(),
  unique(user_id, resource_id)
);

-- =====================
-- Reviews
-- =====================
create table if not exists resource_reviews (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid references resources(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  author_name text,
  author_photo_url text,
  rating integer check (rating >= 1 and rating <= 5),
  text text,
  source text default 'google',
  google_time integer,
  language text default 'en',
  is_approved boolean default true,
  created_at timestamptz default now()
);

-- =====================
-- Community
-- =====================
create table if not exists community_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  title text not null,
  content text not null,
  language text default 'en',
  upvotes integer default 0,
  is_approved boolean default false,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

create table if not exists community_replies (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references community_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  language text default 'en',
  upvotes integer default 0,
  is_approved boolean default false,
  created_at timestamptz default now()
);

-- =====================
-- Notifications
-- =====================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =====================
-- AI conversations
-- =====================
create table if not exists ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  session_id text not null,
  role text not null,
  content text not null,
  language text default 'en',
  created_at timestamptz default now()
);

-- =====================
-- Translation cache
-- =====================
create table if not exists translation_cache (
  id uuid primary key default uuid_generate_v4(),
  source_text text not null,
  source_lang text not null,
  target_lang text not null,
  translated_text text not null,
  created_at timestamptz default now(),
  unique(source_text, source_lang, target_lang)
);

-- =====================
-- Analytics
-- =====================
create table if not exists analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  resource_id uuid,
  category_slug text,
  language text,
  city text,
  created_at timestamptz default now()
);

-- =====================
-- RLS
-- =====================
alter table profiles enable row level security;
alter table resources enable row level security;
alter table categories enable row level security;
alter table pathways enable row level security;
alter table pathway_steps enable row level security;
alter table pathway_step_resources enable row level security;
alter table user_progress enable row level security;
alter table saved_resources enable row level security;
alter table resource_reviews enable row level security;
alter table community_posts enable row level security;
alter table community_replies enable row level security;
alter table notifications enable row level security;
alter table ai_conversations enable row level security;
alter table translation_cache enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all using (auth.uid() = id);

drop policy if exists "public categories" on categories;
create policy "public categories" on categories for select using (true);

drop policy if exists "public resources" on resources;
create policy "public resources" on resources for select using (is_active = true);

drop policy if exists "admin resources" on resources;
create policy "admin resources" on resources for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists "public pathways" on pathways;
create policy "public pathways" on pathways for select using (is_active = true);

drop policy if exists "public steps" on pathway_steps;
create policy "public steps" on pathway_steps for select using (true);

drop policy if exists "public step resources" on pathway_step_resources;
create policy "public step resources" on pathway_step_resources for select using (true);

drop policy if exists "own progress" on user_progress;
create policy "own progress" on user_progress for all using (auth.uid() = user_id);

drop policy if exists "own saved" on saved_resources;
create policy "own saved" on saved_resources for all using (auth.uid() = user_id);

drop policy if exists "public reviews" on resource_reviews;
create policy "public reviews" on resource_reviews for select using (is_approved = true);

drop policy if exists "insert own review" on resource_reviews;
create policy "insert own review" on resource_reviews for insert with check (auth.uid() = user_id);

drop policy if exists "public posts" on community_posts;
create policy "public posts" on community_posts for select using (is_approved = true);

drop policy if exists "insert own post" on community_posts;
create policy "insert own post" on community_posts for insert with check (auth.uid() = user_id);

drop policy if exists "public replies" on community_replies;
create policy "public replies" on community_replies for select using (is_approved = true);

drop policy if exists "insert own reply" on community_replies;
create policy "insert own reply" on community_replies for insert with check (auth.uid() = user_id);

drop policy if exists "own notifications" on notifications;
create policy "own notifications" on notifications for all using (auth.uid() = user_id);

drop policy if exists "own conversations" on ai_conversations;
create policy "own conversations" on ai_conversations for all using (auth.uid() = user_id);

drop policy if exists "public translation cache" on translation_cache;
create policy "public translation cache" on translation_cache for select using (true);

drop policy if exists "insert translation cache" on translation_cache;
create policy "insert translation cache" on translation_cache for insert with check (true);

-- =====================
-- Triggers and helpers
-- =====================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create or replace function increment_click(r_id uuid)
returns void as $$
begin
  update resources set click_count = coalesce(click_count,0) + 1 where id = r_id;
end;
$$ language plpgsql;

create or replace function decrement_save_count(r_id uuid)
returns void as $$
begin
  update resources set save_count = greatest(coalesce(save_count,0) - 1, 0) where id = r_id;
end;
$$ language plpgsql;

-- =====================
-- Seed categories
-- =====================
insert into categories (name, slug, description, icon, color, display_order) values
('Legal & Immigration', 'legal', 'Immigration status, rights, legal aid, and documentation help', 'Scale', '#7C3AED', 1),
('Housing', 'housing', 'Finding a home, tenant rights, emergency shelter, and rental assistance', 'Home', '#2563EB', 2),
('Employment', 'employment', 'Finding work, job training, worker rights, and credential recognition', 'Briefcase', '#059669', 3),
('Healthcare', 'healthcare', 'Clinics, mental health, insurance, and medical services', 'Heart', '#DC2626', 4),
('Education', 'education', 'ESL classes, school enrollment, GED, and college access', 'BookOpen', '#D97706', 5),
('Financial Access', 'financial', 'Banking, credit building, taxes, and financial literacy', 'DollarSign', '#0891B2', 6),
('Emergency Help', 'emergency', 'Immediate help for food, shelter, safety, and crisis situations', 'AlertCircle', '#EA580C', 7),
('Community & Culture', 'community', 'Cultural organizations, social connection, and community events', 'Users', '#8B5CF6', 8)
on conflict (slug) do nothing;

-- =====================
-- Seed resources
-- =====================
insert into resources (name, description, short_description, category_id, website_url, phone, address, city, state, zip, latitude, longitude, google_place_id, google_rating, google_review_count, languages, is_free, serves_undocumented, hours, walk_in_available, weekend_hours, evening_hours, phone_intake, is_verified, is_featured) values
('Latin American Association',
 'Comprehensive immigration legal aid, employment help, housing assistance, ESL classes, and community programs for Latino immigrants in Atlanta.',
 'Comprehensive services for Latino immigrants — legal, employment, housing, education.',
 (select id from categories where slug = 'legal'),
 'https://www.latinaa.org', '(404) 638-1800',
 '2750 Buford Hwy NE, Atlanta, GA 30324', 'Atlanta', 'GA', '30324', 33.8234, -84.3456,
 null, 4.7, 234, '{en,es}', true, true,
 'Mon–Fri 9am–5pm, Sat 10am–2pm', true, true, false, true, true, true),

('Georgia Legal Services Program',
 'Free civil legal aid for low-income Georgians including immigrants. Handles immigration cases, tenant rights, family law, and benefits.',
 'Free legal aid for immigrants — immigration, tenant rights, family law.',
 (select id from categories where slug = 'legal'),
 'https://www.glsp.org', '1-800-498-9469',
 '104 Marietta St NW Suite 1800, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7490, -84.3880,
 null, 4.5, 89, '{en,es}', true, true,
 'Mon–Fri 8:30am–5pm', false, false, false, true, true, true),

('International Rescue Committee Atlanta',
 'Comprehensive resettlement services for refugees and immigrants including employment, housing, health navigation, and legal assistance.',
 'Resettlement services for refugees — jobs, housing, health, legal help.',
 (select id from categories where slug = 'employment'),
 'https://www.rescue.org/united-states/atlanta-ga', '(678) 636-5900',
 '4151 Memorial Dr Suite 201, Decatur, GA 30032', 'Decatur', 'GA', '30032', 33.7726, -84.2963,
 null, 4.8, 156, '{en,am,so,ar,sw}', true, false,
 'Mon–Fri 9am–5pm', false, false, false, true, true, true),

('Grady Memorial Hospital',
 'Full medical services for everyone regardless of immigration status or ability to pay. Emergency care 24/7. Sliding scale fees available.',
 'Healthcare for all regardless of status. Emergency 24/7. Sliding scale fees.',
 (select id from categories where slug = 'healthcare'),
 'https://www.gradyhealth.org', '(404) 616-1000',
 '80 Jesse Hill Jr Dr SE, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7460, -84.3793,
 null, 3.9, 1247, '{en,es,am,vi,ar,hi}', false, true,
 'Emergency: 24/7, Clinics: Mon–Fri 8am–5pm', true, true, true, true, true, true),

('Clarkston Community Center',
 'Comprehensive services for the refugee and immigrant communities in Clarkston — housing navigation, employment, education, and social support.',
 'Comprehensive services for refugees and immigrants in the Clarkston area.',
 (select id from categories where slug = 'housing'),
 'https://www.clarkstoncc.org', '(404) 296-9675',
 '3701 College Ave, Clarkston, GA 30021', 'Clarkston', 'GA', '30021', 33.8135, -84.2395,
 null, 4.9, 312, '{en,am,so,ar,sw,fr}', true, true,
 'Mon–Fri 9am–5pm', true, false, false, true, true, true),

('Atlanta Volunteer Lawyers Foundation',
 'Free legal representation for qualifying low-income residents. Handles housing, immigration, family law, and civil cases.',
 'Free legal representation from volunteer attorneys in Atlanta.',
 (select id from categories where slug = 'legal'),
 'https://www.avlf.com', '(404) 521-0790',
 '151 Spring St NW, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7590, -84.3912,
 null, 4.6, 67, '{en}', true, false,
 'Tue & Thu 5:30pm–8pm (clinics), Mon–Fri 9am–5pm (office)', false, false, true, false, true, false),

('Georgia Asylum and Immigration Network',
 'Free specialized legal representation for asylum seekers, refugees, and immigrants facing detention or deportation in Georgia.',
 'Specialized legal help for asylum seekers and refugees in Georgia.',
 (select id from categories where slug = 'legal'),
 'https://www.gain.ngo', '(404) 808-4142',
 '1100 Spring St NW Suite 300, Atlanta, GA 30309', 'Atlanta', 'GA', '30309', 33.7834, -84.3901,
 null, 4.9, 143, '{en,fr,am,ar,es}', true, true,
 'Mon–Fri 9am–4pm', false, false, false, true, true, false),

('DeKalb Literacy',
 'Free English as a Second Language classes at multiple locations across DeKalb County for adult immigrants and refugees.',
 'Free ESL classes for adult immigrants across DeKalb County.',
 (select id from categories where slug = 'education'),
 'https://www.dekalbcountyga.gov/library/literacy', '(404) 244-7390',
 'Multiple DeKalb County Library locations', 'Decatur', 'GA', '30030', 33.7748, -84.2963,
 null, 4.4, 78, '{en}', true, true,
 'Classes vary by location and session — call to confirm', true, true, true, true, true, false),

('Partners for HOME',
 'Atlanta collaborative initiative to end homelessness — emergency shelter referrals, rapid rehousing, and rental assistance.',
 'Connects people to emergency shelter and rental assistance in Atlanta.',
 (select id from categories where slug = 'housing'),
 'https://www.partnersforhome.org', '(404) 589-7989',
 '230 Peachtree St NW Suite 2150, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7523, -84.3891,
 null, 4.3, 54, '{en}', true, false,
 'Mon–Fri 9am–5pm', false, false, false, true, true, false),

('Open Hand Atlanta',
 'Free medically tailored meal delivery for people with serious illness in Atlanta regardless of immigration status.',
 'Free meal delivery for people with serious illness regardless of status.',
 (select id from categories where slug = 'healthcare'),
 'https://www.openhandatlanta.org', '(404) 872-6947',
 '181 Ponce de Leon Ave NE, Atlanta, GA 30308', 'Atlanta', 'GA', '30308', 33.7718, -84.3701,
 null, 4.8, 189, '{en,es}', true, true,
 'Mon–Fri 8am–5pm', false, false, false, true, true, false),

('Freedom University',
 'Free college preparation, SAT tutoring, and advocacy for undocumented students barred from Georgia public universities.',
 'Free college prep and advocacy for undocumented students in Georgia.',
 (select id from categories where slug = 'education'),
 'https://www.freedomuniversitygeorgia.org', 'Contact via website',
 'Atlanta area — location varies each semester', 'Atlanta', 'GA', '30303', 33.7490, -84.3880,
 null, 5.0, 45, '{en,es}', true, true,
 'Weekly classes — see website for current schedule', false, true, true, false, true, false),

('211 Georgia',
 'Free 24/7 statewide hotline connecting callers to emergency food, shelter, utilities, healthcare, and crisis support in 150+ languages.',
 'Free 24/7 emergency resource hotline. Dial 2-1-1. Available in 150+ languages.',
 (select id from categories where slug = 'emergency'),
 'https://www.211georgia.org', 'Dial 2-1-1',
 'Statewide phone service — Georgia', 'Atlanta', 'GA', '30303', 33.7490, -84.3880,
 null, 4.5, 445, '{en,es,am,ar,vi,fr,hi,so,sw}', true, true,
 '24 hours, 7 days a week', false, true, true, true, true, true),

('New American Pathways',
 'Health navigation, employment, housing, and resettlement services for refugees and immigrants — specializes in East African community.',
 'Health and resettlement services for refugees — specializes in East African community.',
 (select id from categories where slug = 'healthcare'),
 'https://www.newamericanpathways.org', '(404) 299-6684',
 '4151 Memorial Dr Suite 103, Decatur, GA 30032', 'Decatur', 'GA', '30032', 33.7726, -84.2963,
 null, 4.7, 98, '{en,am,so}', true, true,
 'Mon–Fri 9am–5pm', true, false, false, true, true, false),

('Operation HOPE — Atlanta',
 'Free financial coaching, credit building, bank account setup, and small business help for underserved Atlanta residents.',
 'Free financial coaching, credit building, and banking help in Atlanta.',
 (select id from categories where slug = 'financial'),
 'https://www.operationhope.org', '(404) 658-0965',
 '100 Peachtree St NW Suite 2820, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7514, -84.3890,
 null, 4.6, 112, '{en,es}', true, true,
 'Mon–Fri 9am–5pm', false, false, false, true, true, false),

('Atlanta Community Food Bank',
 'Distributes food through 700+ partner agencies across 29 Georgia counties. Find your nearest food pantry through their website.',
 'Food distribution network across metro Atlanta — find nearest pantry online.',
 (select id from categories where slug = 'emergency'),
 'https://www.acfb.org', '(404) 892-9822',
 '3400 N Desert Dr, Atlanta, GA 30344', 'Atlanta', 'GA', '30344', 33.6901, -84.4678,
 null, 4.7, 267, '{en,es}', true, true,
 'Pantry hours vary by location — use website locator', true, true, false, true, true, true),

-- Community & Culture
('Refugee Women''s Network',
 'Empowerment programs, leadership training, and cultural community for refugee and immigrant women across metro Atlanta.',
 'Leadership and cultural programs for refugee and immigrant women.',
 (select id from categories where slug = 'community'),
 'https://www.rwnatlanta.org', '(404) 249-9292',
 '4151 Memorial Dr Suite 202F, Decatur, GA 30032', 'Decatur', 'GA', '30032', 33.7726, -84.2963,
 null, 4.8, 72, '{en,am,so,ar,sw,fr}', true, true,
 'Mon–Fri 9am–5pm', false, false, false, true, true, true),

('Center for Pan Asian Community Services',
 'Comprehensive services for Asian American and immigrant communities — health, citizenship, youth programs, and cultural events.',
 'Comprehensive services for Asian American and immigrant communities.',
 (select id from categories where slug = 'community'),
 'https://www.icpacs.org', '(770) 936-0969',
 '3510 Shallowford Rd NE, Chamblee, GA 30341', 'Chamblee', 'GA', '30341', 33.8912, -84.2961,
 null, 4.7, 186, '{en,zh,ko,vi,hi}', true, true,
 'Mon–Fri 9am–5pm', true, false, false, true, true, true),

('Jewish Family & Career Services',
 'Welcoming services for refugees and immigrants of all backgrounds — career coaching, mental health, and community programs.',
 'Refugee resettlement, career help, and mental health services.',
 (select id from categories where slug = 'community'),
 'https://www.jfcsatl.org', '(770) 677-9300',
 '4549 Chamblee Dunwoody Rd, Atlanta, GA 30338', 'Atlanta', 'GA', '30338', 33.9234, -84.3012,
 null, 4.6, 94, '{en,ru,es}', true, false,
 'Mon–Thu 9am–5pm, Fri 9am–3pm', false, false, false, true, true, false),

('Global Village Project',
 'Middle-school program for refugee girls who have had interrupted schooling — academic support and community building.',
 'Middle school and community for refugee girls with interrupted schooling.',
 (select id from categories where slug = 'community'),
 'https://globalvillageproject.org', '(404) 990-4126',
 '205 Swanton Way, Decatur, GA 30030', 'Decatur', 'GA', '30030', 33.7748, -84.2963,
 null, 4.9, 48, '{en}', true, true,
 'School year hours', false, false, false, true, true, false),

('Atlanta Habesha Community',
 'Cultural center and mutual aid hub for Ethiopian and Eritrean Atlantans — events, translation help, and community support.',
 'Cultural and mutual aid hub for the Ethiopian/Eritrean community.',
 (select id from categories where slug = 'community'),
 'https://www.habeshaatl.org', '(404) 766-5500',
 '2470 Briarcliff Rd NE, Atlanta, GA 30329', 'Atlanta', 'GA', '30329', 33.8189, -84.3234,
 null, 4.7, 58, '{en,am,ti}', true, true,
 'Events vary — check website', false, true, true, false, false, false),

-- Employment
('Goodwill of North Georgia',
 'Free job training, career coaching, and placement services — welcoming to immigrants and refugees.',
 'Free job training and career coaching across metro Atlanta.',
 (select id from categories where slug = 'employment'),
 'https://goodwillng.org', '(404) 486-8400',
 '2201 Glenwood Ave SE, Atlanta, GA 30316', 'Atlanta', 'GA', '30316', 33.7265, -84.3512,
 null, 4.3, 234, '{en,es}', true, true,
 'Mon–Fri 8am–5pm', true, false, false, true, true, true),

('WorkSource Atlanta',
 'City of Atlanta workforce development — job search, training, and career services open to all residents.',
 'City workforce services — job search, training, and placement.',
 (select id from categories where slug = 'employment'),
 'https://www.atlantaga.gov/government/departments/workforce-development-agency', '(404) 546-3000',
 '55 Trinity Ave SW, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7490, -84.3890,
 null, 4.1, 87, '{en,es}', true, false,
 'Mon–Fri 8:30am–5pm', false, false, false, true, true, false),

('Center for Working Families',
 'Free career coaching, financial coaching, and skills training for underserved Atlantans — welcomes immigrants.',
 'Career and financial coaching for underserved Atlantans.',
 (select id from categories where slug = 'employment'),
 'https://www.thecwf.org', '(404) 223-2262',
 '477 Windsor St SW, Atlanta, GA 30312', 'Atlanta', 'GA', '30312', 33.7412, -84.4012,
 null, 4.5, 63, '{en,es}', true, true,
 'Mon–Fri 9am–5pm', false, false, false, true, true, false),

('Inspiritus Employment Services',
 'Refugee-focused employment services including job placement, career coaching, and professional credential support.',
 'Refugee employment placement and career coaching.',
 (select id from categories where slug = 'employment'),
 'https://weinspirit.org', '(678) 248-4357',
 '1899 Clifton Rd NE, Atlanta, GA 30329', 'Atlanta', 'GA', '30329', 33.7978, -84.3234,
 null, 4.6, 54, '{en,am,so,ar,sw,fr}', true, true,
 'Mon–Fri 9am–5pm', false, false, false, true, true, false),

-- Financial Access
('VITA Atlanta (United Way)',
 'Free tax preparation for households earning under $60,000 — ITIN filing supported. Multiple Atlanta locations.',
 'Free tax preparation and ITIN filing help.',
 (select id from categories where slug = 'financial'),
 'https://unitedwayatlanta.org/vita', 'Dial 2-1-1',
 '100 Edgewood Ave NE Suite 1700, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7551, -84.3870,
 null, 4.7, 142, '{en,es,zh,vi}', true, true,
 'January–April — hours vary by site', true, true, true, true, true, true),

('Latin American Association Financial Services',
 'Free financial coaching, credit building, and tax prep tailored for the Latino immigrant community.',
 'Financial coaching and tax prep for Latino immigrants.',
 (select id from categories where slug = 'financial'),
 'https://www.latinaa.org/financial-opportunities', '(404) 638-1800',
 '2750 Buford Hwy NE, Atlanta, GA 30324', 'Atlanta', 'GA', '30324', 33.8234, -84.3456,
 null, 4.8, 97, '{en,es}', true, true,
 'Mon–Fri 9am–5pm', true, true, false, true, true, false),

('CredAbility / GreenPath Atlanta',
 'Free nonprofit credit counseling, debt management, and housing counseling in multiple languages.',
 'Free nonprofit credit and debt counseling.',
 (select id from categories where slug = 'financial'),
 'https://www.greenpath.com', '1-800-550-1961',
 '3330 Cumberland Blvd SE Suite 400, Atlanta, GA 30339', 'Atlanta', 'GA', '30339', 33.8823, -84.4678,
 null, 4.4, 178, '{en,es}', true, true,
 'Mon–Fri 8am–10pm, Sat 9am–5pm', false, true, true, true, true, false),

('Atlanta Postal Credit Union',
 'Immigrant-friendly credit union offering basic banking, small loans, and ITIN-based accounts.',
 'Immigrant-friendly credit union with ITIN accounts.',
 (select id from categories where slug = 'financial'),
 'https://www.apcu.com', '(404) 768-4126',
 '3315 Constitution Blvd, Atlanta, GA 30354', 'Atlanta', 'GA', '30354', 33.6656, -84.4189,
 null, 4.5, 89, '{en,es}', true, true,
 'Mon–Fri 8:30am–5pm, Sat 9am–12pm', true, true, false, true, true, false),

-- Housing
('Nicholas House',
 'Emergency and transitional housing for families with children experiencing homelessness in Atlanta.',
 'Emergency and transitional housing for homeless families with children.',
 (select id from categories where slug = 'housing'),
 'https://www.nicholashouse.org', '(404) 622-0793',
 '830 Boulevard SE, Atlanta, GA 30312', 'Atlanta', 'GA', '30312', 33.7312, -84.3712,
 null, 4.6, 62, '{en,es}', true, false,
 'Mon–Fri 8am–5pm (intake)', false, false, false, true, true, false),

('Atlanta Mission',
 'Emergency shelter, transitional housing, and rehabilitation for men, women, and children.',
 'Emergency and transitional shelter for individuals and families.',
 (select id from categories where slug = 'housing'),
 'https://atlantamission.org', '(404) 367-2493',
 '2353 Bolton Rd NW, Atlanta, GA 30318', 'Atlanta', 'GA', '30318', 33.8234, -84.4345,
 null, 4.3, 345, '{en,es}', true, false,
 '24/7 intake', true, true, true, true, true, false),

('HomeAid Atlanta',
 'Connects families to safe housing through partnerships with shelters and housing providers across metro Atlanta.',
 'Connects homeless families to safe housing partnerships.',
 (select id from categories where slug = 'housing'),
 'https://www.homeaidatlanta.org', '(678) 775-1401',
 '1484 Brockett Rd, Tucker, GA 30084', 'Tucker', 'GA', '30084', 33.8567, -84.2234,
 null, 4.4, 41, '{en}', true, false,
 'Mon–Fri 9am–5pm', false, false, false, true, true, false),

-- Healthcare
('Mercy Care Atlanta',
 'Healthcare for homeless and low-income individuals — full medical, dental, and behavioral health, regardless of status.',
 'Medical, dental, and mental health for all regardless of status.',
 (select id from categories where slug = 'healthcare'),
 'https://mercyatlanta.org', '(678) 843-8500',
 '424 Decatur St SE, Atlanta, GA 30312', 'Atlanta', 'GA', '30312', 33.7534, -84.3723,
 null, 4.5, 198, '{en,es,vi,am}', true, true,
 'Mon–Fri 8am–5pm', true, false, false, true, true, true),

('Good Samaritan Health Center',
 'Affordable primary care, dental, and vision for uninsured families in Atlanta — sliding scale fees.',
 'Affordable medical, dental, and vision for uninsured families.',
 (select id from categories where slug = 'healthcare'),
 'https://goodsamatlanta.org', '(404) 523-6571',
 '1015 Donald Lee Hollowell Pkwy NW, Atlanta, GA 30318', 'Atlanta', 'GA', '30318', 33.7689, -84.4234,
 null, 4.7, 156, '{en,es,am,ar}', false, true,
 'Mon–Fri 8am–5pm', false, false, true, true, true, false),

('Ben Massell Dental Clinic',
 'Free dental care for low-income adults — fillings, extractions, and cleanings for uninsured Atlantans.',
 'Free dental care for low-income uninsured adults.',
 (select id from categories where slug = 'healthcare'),
 'https://benmasselldental.org', '(770) 677-9280',
 '1605 Peachtree St NE, Atlanta, GA 30309', 'Atlanta', 'GA', '30309', 33.7934, -84.3867,
 null, 4.7, 118, '{en,es}', true, true,
 'Mon–Thu by appointment', false, false, false, true, true, false),

-- Education
('Refugee Family Literacy Project',
 'Free family literacy classes for refugee parents — combines ESL and parenting with early childhood support.',
 'Free ESL and parenting classes for refugee families.',
 (select id from categories where slug = 'education'),
 'https://www.rflpga.org', '(404) 508-0300',
 '3665 Rockbridge Rd, Avondale Estates, GA 30002', 'Avondale Estates', 'GA', '30002', 33.7741, -84.2678,
 null, 4.9, 38, '{en,am,so,ar,sw,fr}', true, true,
 'Mon–Fri 9am–12pm', false, false, false, true, true, false),

('Latin American Association ESL',
 'Free English classes at beginner, intermediate, and advanced levels for adult Latino immigrants.',
 'Free English classes for adult Latino immigrants.',
 (select id from categories where slug = 'education'),
 'https://www.latinaa.org/education', '(404) 638-1800',
 '2750 Buford Hwy NE, Atlanta, GA 30324', 'Atlanta', 'GA', '30324', 33.8234, -84.3456,
 null, 4.7, 112, '{en,es}', true, true,
 'Mon–Thu evenings, Sat mornings', false, true, true, true, true, false),

('Atlanta Public Schools — Adult ESL',
 'Free adult ESL classes at multiple Atlanta Public School locations — registration open year-round.',
 'Free adult ESL classes at APS locations.',
 (select id from categories where slug = 'education'),
 'https://www.atlantapublicschools.us', '(404) 802-3500',
 '130 Trinity Ave SW, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7490, -84.3909,
 null, 4.0, 45, '{en,es}', true, true,
 'Class schedules vary', false, false, true, true, true, false),

-- Emergency
('Salvation Army Atlanta',
 'Emergency food, shelter, utility assistance, and holiday support for families in crisis.',
 'Emergency food, shelter, and utility assistance.',
 (select id from categories where slug = 'emergency'),
 'https://www.salvationarmygeorgia.org', '(404) 486-2900',
 '1000 Center Pl, Norcross, GA 30093', 'Norcross', 'GA', '30093', 33.9234, -84.2178,
 null, 4.2, 287, '{en,es}', true, true,
 'Mon–Fri 9am–4pm', true, false, false, true, true, false),

('Goodr',
 'Atlanta-based food rescue organization delivering free groceries to families through partner pop-ups.',
 'Free groceries through community pop-ups in Atlanta.',
 (select id from categories where slug = 'emergency'),
 'https://goodr.co', '(678) 883-1124',
 '756 W Peachtree St NW, Atlanta, GA 30308', 'Atlanta', 'GA', '30308', 33.7756, -84.3878,
 null, 4.8, 167, '{en,es}', true, true,
 'Pop-ups scheduled weekly — see social media', true, true, false, true, true, false),

-- Legal additional
('Catholic Charities Atlanta Immigration',
 'Low-cost immigration legal services — DACA renewals, family petitions, citizenship, and humanitarian cases.',
 'Low-cost immigration legal services across Atlanta.',
 (select id from categories where slug = 'legal'),
 'https://ccatlanta.org/immigration-legal-services', '(678) 222-3920',
 '2401 Lake Park Dr SE, Smyrna, GA 30080', 'Smyrna', 'GA', '30080', 33.8678, -84.5189,
 null, 4.6, 143, '{en,es,vi,fr}', false, true,
 'Mon–Fri 9am–4pm', false, false, false, true, true, false),

('Tahirih Justice Center — Atlanta',
 'Free legal and social services for immigrant survivors of gender-based violence.',
 'Free legal help for immigrant survivors of gender-based violence.',
 (select id from categories where slug = 'legal'),
 'https://www.tahirih.org/where-we-work/atlanta', '(571) 282-6161',
 '1100 Peachtree St NE, Atlanta, GA 30309', 'Atlanta', 'GA', '30309', 33.7834, -84.3845,
 null, 4.9, 41, '{en,es,fr,ar}', true, true,
 'Mon–Fri 9am–5pm', false, false, false, true, true, false),

-- Batch 3: broader coverage across all categories
('ACLU of Georgia', 'Civil rights and immigrant rights defense in Georgia — legal advocacy, know-your-rights resources, and crisis response.', 'Civil rights and immigrant rights legal advocacy in Georgia.', (select id from categories where slug = 'legal'), 'https://www.acluga.org', '(770) 303-8111', '1100 Spring St NW Suite 640, Atlanta, GA 30309', 'Atlanta', 'GA', '30309', 33.7834, -84.3895, null, 4.6, 132, '{en,es}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('Project South', 'Grassroots organizing and legal advocacy for immigrants, detainees, and low-income Southerners.', 'Grassroots legal advocacy for immigrants in the South.', (select id from categories where slug = 'legal'), 'https://projectsouth.org', '(404) 622-0602', '9 Gammon Ave SW, Atlanta, GA 30315', 'Atlanta', 'GA', '30315', 33.7145, -84.4023, null, 4.8, 76, '{en,es}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('Southern Poverty Law Center — Atlanta', 'Immigrant justice, hate crime response, and civil rights litigation across the Deep South.', 'Civil rights litigation and immigrant justice.', (select id from categories where slug = 'legal'), 'https://www.splcenter.org', '(404) 521-6700', '150 E Ponce de Leon Ave Suite 340, Decatur, GA 30030', 'Decatur', 'GA', '30030', 33.7748, -84.2963, null, 4.5, 214, '{en,es}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('Kids In Need of Defense (KIND)', 'Free legal representation for unaccompanied immigrant children facing deportation.', 'Free legal help for immigrant children facing deportation.', (select id from categories where slug = 'legal'), 'https://supportkind.org', '(202) 824-8680', '1100 Peachtree St NE Suite 250, Atlanta, GA 30309', 'Atlanta', 'GA', '30309', 33.7834, -84.3845, null, 4.9, 58, '{en,es,fr}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),

('Covenant House Georgia', 'Shelter, housing support, and workforce programs for homeless young people ages 18–25.', 'Shelter and support for homeless young adults ages 18–25.', (select id from categories where slug = 'housing'), 'https://www.covenanthousega.org', '(404) 589-0163', '1559 Johnson Rd NW, Atlanta, GA 30318', 'Atlanta', 'GA', '30318', 33.7898, -84.4456, null, 4.4, 87, '{en,es}', true, true, '24/7 intake', true, true, true, true, true, false),
('City of Refuge Atlanta', 'Emergency shelter, transitional housing, workforce training, and healthcare for individuals and families in crisis.', 'Emergency shelter, workforce, and healthcare hub.', (select id from categories where slug = 'housing'), 'https://cityofrefugeatl.org', '(404) 874-2241', '1300 Joseph E Boone Blvd NW, Atlanta, GA 30314', 'Atlanta', 'GA', '30314', 33.7623, -84.4298, null, 4.5, 276, '{en,es}', true, true, '24/7', true, true, true, true, true, true),
('Decatur Cooperative Ministry', 'Family shelter, rental assistance, and food pantry serving DeKalb families in crisis.', 'Family shelter and rental assistance in DeKalb.', (select id from categories where slug = 'housing'), 'https://decaturcoopmin.org', '(404) 377-5365', '705 Commerce Dr, Decatur, GA 30030', 'Decatur', 'GA', '30030', 33.7748, -84.2963, null, 4.6, 41, '{en,es}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('Housing Initiative of Atlanta', 'Free legal aid for tenants facing eviction — representation, counsel, and rental assistance.', 'Free legal aid for tenants facing eviction.', (select id from categories where slug = 'housing'), 'https://www.hiatl.org', '(404) 521-0790', '54 Ellis St NE, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7545, -84.3867, null, 4.7, 134, '{en,es}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, true),

('Friends of Refugees', 'Employment training, community gardens, and support services for refugees in Clarkston.', 'Employment training and support for refugees in Clarkston.', (select id from categories where slug = 'employment'), 'https://friendsofrefugees.com', '(404) 299-6426', '1024 Rowland St, Clarkston, GA 30021', 'Clarkston', 'GA', '30021', 33.8135, -84.2395, null, 4.8, 89, '{en,am,so,ar,sw,fr}', true, true, 'Mon–Fri 9am–5pm', true, false, false, true, true, false),
('Global Growers Network', 'Sustainable farming and food business training for refugees and immigrant families in metro Atlanta.', 'Farming and food business training for refugees.', (select id from categories where slug = 'employment'), 'https://globalgrowers.org', '(404) 400-5678', '6075 Pangborn Rd, Decatur, GA 30032', 'Decatur', 'GA', '30032', 33.7598, -84.2712, null, 4.9, 63, '{en,am,so,ar,sw,fr,es}', true, true, 'Seasonal — see website', false, true, false, true, true, false),
('Clarkston Development Foundation', 'Small business incubator, workforce training, and economic development for Clarkston refugees.', 'Small business and workforce support for refugees.', (select id from categories where slug = 'employment'), 'https://www.clarkstondevelopment.org', '(404) 270-3660', '3701 College Ave, Clarkston, GA 30021', 'Clarkston', 'GA', '30021', 33.8135, -84.2395, null, 4.6, 47, '{en,am,so,ar,sw,fr}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),

('DeKalb Board of Health Clinics', 'Public health clinics across DeKalb County providing immunizations, prenatal care, and sliding-fee medical services.', 'Public health clinics across DeKalb — sliding-fee care.', (select id from categories where slug = 'healthcare'), 'https://dekalbhealth.net', '(404) 294-3700', '445 Winn Way, Decatur, GA 30030', 'Decatur', 'GA', '30030', 33.7812, -84.2945, null, 3.8, 312, '{en,es,vi,am,ar}', false, true, 'Mon–Fri 8am–4pm', true, false, false, true, true, false),
('Mental Health America of Georgia', 'Free mental health screenings, support groups, and referral services for uninsured Georgians.', 'Free mental health screenings and support.', (select id from categories where slug = 'healthcare'), 'https://www.mhageorgia.org', '(770) 741-1481', '100 Edgewood Ave NE Suite 502, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7551, -84.3870, null, 4.6, 89, '{en,es}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('CORE Atlanta', 'Free mobile health services — COVID testing, flu shots, basic primary care — in underserved Atlanta neighborhoods.', 'Free mobile health and vaccination services.', (select id from categories where slug = 'healthcare'), 'https://www.coreresponse.org', '(470) 395-2673', 'Mobile — Atlanta metro', 'Atlanta', 'GA', '30303', 33.7490, -84.3880, null, 4.7, 134, '{en,es,am,so,ar,vi}', true, true, 'Events vary — see website', true, true, false, true, true, false),
('Planned Parenthood Atlanta', 'Low-cost reproductive healthcare, STI testing, and family planning — welcomes uninsured patients.', 'Low-cost reproductive healthcare and family planning.', (select id from categories where slug = 'healthcare'), 'https://www.plannedparenthood.org/health-center/georgia/atlanta', '(404) 688-9300', '440 Boulevard NE, Atlanta, GA 30308', 'Atlanta', 'GA', '30308', 33.7723, -84.3734, null, 4.5, 456, '{en,es}', false, true, 'Mon–Fri 8am–6pm, Sat 8am–4pm', true, true, false, true, true, false),

('Literacy Action', 'Free adult literacy, basic education, and ESL classes in multiple Atlanta locations.', 'Free adult literacy and ESL classes.', (select id from categories where slug = 'education'), 'https://www.literacyaction.org', '(404) 818-7323', '101 Marietta St NW Suite 1250, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7545, -84.3956, null, 4.7, 112, '{en,es}', true, true, 'Mon–Thu day & evening', false, false, true, true, true, true),
('Atlanta Technical College ESL', 'Free adult ESL and GED classes across multiple locations — welcomes immigrants and refugees.', 'Free adult ESL and GED classes at ATC.', (select id from categories where slug = 'education'), 'https://www.atlantatech.edu', '(404) 225-4400', '1560 Metropolitan Pkwy SW, Atlanta, GA 30310', 'Atlanta', 'GA', '30310', 33.7123, -84.4134, null, 4.2, 167, '{en,es}', true, true, 'Registration open fall/spring/summer', false, false, true, true, true, false),
('Georgia State University ESL', 'Intensive English Program for adults — pay-per-semester, supports transition to US college.', 'Intensive English Program for adults at GSU.', (select id from categories where slug = 'education'), 'https://ielp.gsu.edu', '(404) 413-5200', '33 Gilmer St SE, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7534, -84.3861, null, 4.5, 98, '{en}', false, true, 'Fall/Spring semesters', false, false, true, true, true, false),
('Catholic Charities Education', 'Free ESL and citizenship prep classes at parish and community centers across metro Atlanta.', 'Free ESL and citizenship prep at Catholic Charities.', (select id from categories where slug = 'education'), 'https://ccatlanta.org', '(678) 222-3920', '2401 Lake Park Dr SE, Smyrna, GA 30080', 'Smyrna', 'GA', '30080', 33.8678, -84.5189, null, 4.5, 87, '{en,es,vi}', true, true, 'Evening classes at multiple sites', false, false, true, true, true, false),

('Kiva Atlanta', 'Zero-interest microloans for entrepreneurs and small businesses — crowdfunded, welcomes immigrants.', 'Zero-interest microloans for small businesses.', (select id from categories where slug = 'financial'), 'https://www.kiva.org/atlanta', '(470) 210-3000', '100 Peachtree St NW Suite 2820, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7514, -84.3890, null, 4.8, 64, '{en,es}', true, true, 'Online applications — 24/7', false, true, true, true, true, false),
('Access to Capital for Entrepreneurs', 'Small business loans and coaching for women, minorities, and immigrant entrepreneurs in Atlanta.', 'Small business loans for minority and immigrant entrepreneurs.', (select id from categories where slug = 'financial'), 'https://www.aceloans.org', '(678) 335-5600', '6100 Lake Forrest Dr Suite 500, Atlanta, GA 30328', 'Atlanta', 'GA', '30328', 33.9045, -84.3845, null, 4.7, 112, '{en,es}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('Atlanta Habitat for Humanity', 'Affordable homeownership, financial literacy, and home repair help for low-income Atlantans.', 'Affordable homeownership and financial literacy.', (select id from categories where slug = 'financial'), 'https://www.atlantahabitat.org', '(404) 223-5180', '824 Memorial Dr SE, Atlanta, GA 30316', 'Atlanta', 'GA', '30316', 33.7445, -84.3524, null, 4.8, 178, '{en,es}', true, false, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('Credit Union of Georgia', 'Community credit union offering ITIN accounts, small loans, and financial education.', 'Community credit union with ITIN accounts.', (select id from categories where slug = 'financial'), 'https://www.cuofga.org', '(678) 486-1111', '4178 Atlanta Rd SE, Smyrna, GA 30080', 'Smyrna', 'GA', '30080', 33.8678, -84.5189, null, 4.6, 142, '{en,es}', true, true, 'Mon–Fri 9am–5pm, Sat 9am–1pm', true, true, false, true, true, false),

('Crisis Text Line', 'Free, confidential 24/7 mental health crisis support via text — text HOME to 741741.', 'Free 24/7 text-based mental health crisis support.', (select id from categories where slug = 'emergency'), 'https://www.crisistextline.org', 'Text HOME to 741741', 'Text-based — nationwide', 'Atlanta', 'GA', '30303', 33.7490, -84.3880, null, 4.8, 512, '{en,es}', true, true, '24/7', false, true, true, true, true, true),
('988 Suicide & Crisis Lifeline', 'Free, confidential 24/7 mental health crisis hotline — dial 988.', 'Free 24/7 mental health crisis hotline. Dial 988.', (select id from categories where slug = 'emergency'), 'https://988lifeline.org', 'Dial 988', 'Phone service — nationwide', 'Atlanta', 'GA', '30303', 33.7490, -84.3880, null, 4.7, 389, '{en,es,zh,vi,ko,ru,ar,fr}', true, true, '24/7', false, true, true, true, true, true),
('Shepherd''s Inn', 'Emergency shelter and support for homeless men in Atlanta — meals, showers, and case management.', 'Emergency shelter and support for homeless men.', (select id from categories where slug = 'emergency'), 'https://atlantamission.org/shepherds-inn', '(404) 367-2493', '156 Pryor St SE, Atlanta, GA 30303', 'Atlanta', 'GA', '30303', 33.7467, -84.3878, null, 4.0, 134, '{en,es}', true, false, '24/7 intake', true, true, true, true, true, false),
('Nicholas House Crisis Line', 'Crisis rental and utility assistance for families at imminent risk of eviction or homelessness.', 'Crisis rental and utility assistance for families.', (select id from categories where slug = 'emergency'), 'https://www.nicholashouse.org', '(404) 622-0793', '830 Boulevard SE, Atlanta, GA 30312', 'Atlanta', 'GA', '30312', 33.7312, -84.3712, null, 4.6, 48, '{en,es}', true, true, 'Mon–Fri 8am–5pm', false, false, false, true, true, false),

('Church World Service Atlanta', 'Refugee resettlement, legal aid, and community building for newly arrived refugees.', 'Refugee resettlement and community support.', (select id from categories where slug = 'community'), 'https://cwsglobal.org/our-work/offices/atlanta', '(404) 347-3200', '2480 Mt Vernon Rd Suite 220, Dunwoody, GA 30338', 'Dunwoody', 'GA', '30338', 33.9234, -84.3412, null, 4.7, 67, '{en,am,so,ar,sw,fr,fa,ps}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('Afghan Community of Georgia', 'Community support, cultural events, and settlement help for Afghan refugees in metro Atlanta.', 'Community support for Afghan refugees in Atlanta.', (select id from categories where slug = 'community'), 'https://www.afghancommunityofga.org', '(678) 999-1212', 'Clarkston area — events vary', 'Clarkston', 'GA', '30021', 33.8135, -84.2395, null, 4.9, 38, '{en,fa,ps}', true, true, 'Events vary — contact to confirm', false, true, true, false, false, false),
('Somali American Community Center', 'Cultural hub, language support, and social services for Somali Atlantans.', 'Cultural hub for Somali Atlantans.', (select id from categories where slug = 'community'), 'https://saccatl.org', '(770) 938-0988', '5030 Buford Hwy NE, Doraville, GA 30340', 'Doraville', 'GA', '30340', 33.8978, -84.2834, null, 4.7, 52, '{en,so,ar}', true, true, 'Mon–Fri 10am–6pm', false, true, true, false, true, false),
('Vietnamese American Community of Atlanta', 'Cultural events, language classes, and mutual aid for Vietnamese Atlantans.', 'Cultural center for the Vietnamese community.', (select id from categories where slug = 'community'), 'https://www.vacatlanta.org', '(770) 457-0100', '5000 Buford Hwy NE, Chamblee, GA 30341', 'Chamblee', 'GA', '30341', 33.8912, -84.2961, null, 4.6, 89, '{en,vi}', true, true, 'Events vary — check calendar', false, true, true, false, false, false),
('Hispanic Community Services', 'Community hub for Hispanic Atlantans — cultural events, social support, and information referrals.', 'Community hub for Hispanic Atlantans.', (select id from categories where slug = 'community'), 'https://www.hispaniccommunity.org', '(770) 279-5500', '4780 Peachtree Industrial Blvd, Norcross, GA 30071', 'Norcross', 'GA', '30071', 33.9389, -84.2123, null, 4.5, 78, '{en,es}', true, true, 'Mon–Fri 9am–5pm', false, false, false, true, true, false),
('Muslim American Society — Atlanta', 'Community center, youth programs, and social services for Muslim Atlantans of all backgrounds.', 'Community center for Muslim Atlantans.', (select id from categories where slug = 'community'), 'https://www.masatlanta.org', '(770) 662-8900', '4330 Shallowford Rd, Marietta, GA 30062', 'Marietta', 'GA', '30062', 34.0345, -84.4689, null, 4.8, 124, '{en,ar,so,ur}', true, true, 'Events vary — see website', false, true, true, false, true, false)
on conflict do nothing;

-- Example pathway for Housing
insert into pathways (category_id, title, description, estimated_time, is_active)
select id, 'Find stable housing in Atlanta', 'A step-by-step guide to emergency shelter and longer-term housing options.', '2–4 weeks', true
from categories where slug = 'housing'
on conflict do nothing;
