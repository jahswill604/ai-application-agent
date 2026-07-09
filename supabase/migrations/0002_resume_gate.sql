-- ============================================================
-- Migration: 0002_resume_gate.sql
-- Extends profiles table + adds resumes table + RLS policies
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ============================================================
-- 1. EXTEND profiles table — add all new columns
--    (safe: IF NOT EXISTS guards prevent errors on re-run)
-- ============================================================
alter table public.profiles
  add column if not exists full_name          text,
  add column if not exists headline           text,
  add column if not exists phone              text,
  add column if not exists location           text,
  add column if not exists summary            text,
  add column if not exists skills             jsonb        not null default '[]'::jsonb,
  add column if not exists work_experience    jsonb        not null default '[]'::jsonb,
  add column if not exists education          jsonb        not null default '[]'::jsonb,
  add column if not exists projects           jsonb        not null default '[]'::jsonb,
  add column if not exists certifications     jsonb        not null default '[]'::jsonb,
  add column if not exists contact_details    jsonb        not null default '{}'::jsonb,
  add column if not exists resume_uploaded    boolean      not null default false,
  add column if not exists profile_completed  boolean      not null default false,
  add column if not exists updated_at         timestamptz  not null default now();

-- ============================================================
-- 2. auto-update updated_at on every row change
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. CREATE resumes table
-- ============================================================
create table if not exists public.resumes (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  file_name        text        not null,
  storage_path     text        not null,
  file_size_bytes  integer,
  mime_type        text,
  version          text        not null default 'v1.0',
  status           text        not null default 'active'
                               check (status in ('active', 'archived')),
  uploaded_at      timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes (user_id);
create index if not exists resumes_status_idx  on public.resumes (user_id, status);

-- ============================================================
-- 4. RLS on resumes
-- ============================================================
alter table public.resumes enable row level security;

drop policy if exists "Users manage their own resumes" on public.resumes;
create policy "Users manage their own resumes"
  on public.resumes
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 5. INSERT policy on profiles (needed for upsert from API route)
-- ============================================================
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- ============================================================
-- MANUAL STEPS IN SUPABASE DASHBOARD (cannot be done via SQL):
--
--   Storage → New Bucket
--     Name:    resumes
--     Public:  OFF  (private bucket — signed URLs only)
--
--   Storage → Policies → resumes bucket → New Policy
--     Operation:  SELECT, INSERT, UPDATE, DELETE
--     Expression: (auth.uid()::text = (storage.foldername(name))[1])
--
-- This ensures users can only access files under resumes/{their-uid}/
-- ============================================================
