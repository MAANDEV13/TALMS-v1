-- ==========================================================
-- TALMS — Supabase Database Schema + Seed
-- Run this entire script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cxoevlqnjseogenpghkg/sql
-- ==========================================================

-- 1. PROFILES (linked to auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin','officer','director','general_director','minister')),
  status text not null default 'Active',
  created_at timestamptz default now()
);
alter table profiles enable row level security;
drop policy if exists "Users read own profile" on profiles;
drop policy if exists "Admins manage all profiles" on profiles;
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Admins manage all profiles" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 2. AGENCIES
create table if not exists agencies (
  id uuid primary key default gen_random_uuid(),
  license_id text unique not null,
  name text unique not null,
  region text,
  city text,
  status text default 'Active',
  contact_person text,
  phone text,
  email text,
  alternate_person jsonb,
  docs text[] default '{}',
  issue_date date,
  expiry_date date,
  created_at timestamptz default now()
);
alter table agencies enable row level security;
drop policy if exists "Authenticated users can read agencies" on agencies;
drop policy if exists "Officers/Admins can insert agencies" on agencies;
drop policy if exists "Admins/GD can update agencies" on agencies;
create policy "Authenticated users can read agencies" on agencies for select using (auth.role() = 'authenticated');
create policy "Officers/Admins can insert agencies" on agencies for insert with check (auth.role() = 'authenticated');
create policy "Admins/GD can update agencies" on agencies for update using (auth.role() = 'authenticated');

-- 3. APPLICATIONS
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  agency_id text,
  agency text not null,
  region text,
  district text,
  type text not null check (type in ('New','Renewal')),
  status text not null default 'Under Review',
  status_color text default 'amber',
  contact_person text,
  phone text,
  email text,
  alternate_person jsonb,
  business_type text,
  financials jsonb,
  uploaded_docs text[] default '{}',
  doc_file_names jsonb,
  review_comment text,
  register_date date default current_date,
  submitted_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table applications enable row level security;
drop policy if exists "All authenticated users can read applications" on applications;
drop policy if exists "Officers can insert applications" on applications;
drop policy if exists "Reviewers can update applications" on applications;
create policy "All authenticated users can read applications" on applications for select using (auth.role() = 'authenticated');
create policy "Officers can insert applications" on applications for insert with check (auth.role() = 'authenticated');
create policy "Reviewers can update applications" on applications for update using (auth.role() = 'authenticated');

-- 4. AGENCY CHANGE REQUESTS
create table if not exists agency_changes (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id),
  type text not null check (type in ('edit','delete')),
  data jsonb,
  requester_name text,
  status text default 'Pending DG Approval',
  created_at timestamptz default now()
);
alter table agency_changes enable row level security;
drop policy if exists "All authenticated can read changes" on agency_changes;
drop policy if exists "All authenticated can insert changes" on agency_changes;
drop policy if exists "GD/Admin can update changes" on agency_changes;
create policy "All authenticated can read changes" on agency_changes for select using (auth.role() = 'authenticated');
create policy "All authenticated can insert changes" on agency_changes for insert with check (auth.role() = 'authenticated');
create policy "GD/Admin can update changes" on agency_changes for update using (auth.role() = 'authenticated');

-- 5. ACTIVITIES / AUDIT LOG
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  "user" text not null,
  action text not null,
  target text not null,
  timestamp timestamptz default now(),
  date text,
  time text
);
alter table activities enable row level security;
drop policy if exists "All authenticated can insert activities" on activities;
drop policy if exists "Only admins can read all activities" on activities;
create policy "All authenticated can insert activities" on activities for insert with check (auth.role() = 'authenticated');
create policy "Only admins can read all activities" on activities for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 6. FINES
create table if not exists fines (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id),
  agency_name text not null,
  amount numeric not null,
  reason text,
  issued_by text,
  status text default 'Unpaid',
  created_at timestamptz default now()
);
alter table fines enable row level security;
drop policy if exists "Authenticated users read fines" on fines;
drop policy if exists "Director/Admin can manage fines" on fines;
create policy "Authenticated users read fines" on fines for select using (auth.role() = 'authenticated');
create policy "Director/Admin can manage fines" on fines for all using (auth.role() = 'authenticated');

-- 7. SETTINGS (single row)
create table if not exists settings (
  id int primary key default 1,
  registration_fee numeric default 1000,
  renewal_fee numeric default 600,
  application_fee numeric default 500,
  cert_auth_text text default 'This certificate authorizes the holder to operate as a licensed Travel Agency, providing approved travel and tourism services in accordance with the laws and regulations of the Republic of Somaliland and applicable International aviation standards.',
  cert_suspension_text text default 'This certificate is subject to periodic review and may be suspended or revoked in the event of noncompliance with the applicable laws and regulations.'
);
alter table settings enable row level security;
drop policy if exists "All authenticated can read settings" on settings;
drop policy if exists "Only admins can update settings" on settings;
create policy "All authenticated can read settings" on settings for select using (auth.role() = 'authenticated');
create policy "Only admins can update settings" on settings for update using (auth.role() = 'authenticated');

-- Seed default settings row (idempotent)
insert into settings (id) values (1) on conflict (id) do nothing;

-- ==========================================================
-- SEED: System Users (create in Auth → Users dashboard first,
-- then run this to add their profiles)
--
-- After creating these 4 users in the Supabase Auth dashboard:
--   admin@agency.gov      / admin123
--   officer@agency.gov    / admin123
--   director@agency.gov   / admin123
--   gd@agency.gov         / admin123
--
-- Then replace the UUIDs below with the real ones from
-- Authentication → Users in your Supabase dashboard.
-- ==========================================================

-- INSERT INTO profiles (id, name, role, status) VALUES
--   ('<admin-uuid>',    'Admin User',     'admin',            'Active'),
--   ('<officer-uuid>',  'Ahmed Officer',  'officer',          'Active'),
--   ('<director-uuid>', 'Sarah Director', 'director',         'Active'),
--   ('<gd-uuid>',       'Guleid General', 'general_director', 'Active');
