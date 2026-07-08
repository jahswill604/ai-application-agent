-- Migration: 0001_profiles.sql
-- Creates the profiles table with RLS and a trigger to auto-create profiles
-- on new user sign-up.

-- ============================================================
-- 1. Create profiles table
-- ============================================================
create table if not exists public.profiles (
  id         uuid        primary key references auth.users (id) on delete cascade,
  name       text,
  email      text,
  avatar     text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. Enable Row Level Security
-- ============================================================
alter table public.profiles enable row level security;

-- ============================================================
-- 3. RLS Policies
-- ============================================================

-- Users can view their own profile only
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile only
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 4. Trigger: auto-create profile on new user sign-up
-- ============================================================

-- Function that runs after a new user is inserted into auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, avatar)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      null
    )
  );
  return new;
end;
$$;

-- Trigger fires after every insert on auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
