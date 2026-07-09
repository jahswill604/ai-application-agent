-- Migration: 0003_jobs.sql
-- Creates the jobs table for storing job listings fetched from Brave Search API.
-- Includes caching support (fetched_at), platform tracking, and per-user RLS.

-- ============================================================
-- 1. Create jobs table
-- ============================================================
create table if not exists public.jobs (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,

  -- Platform & source
  platform         text        not null check (platform in ('greenhouse', 'lever', 'workable', 'wellfound')),
  job_url          text,
  source_url       text,

  -- Job details
  title            text        not null,
  company          text,
  company_logo     text,
  location         text,
  salary           text,
  job_type         text,           -- e.g. "Full-time", "Contract"
  experience_level text,           -- e.g. "Senior", "Mid-level"
  description      text,

  -- Structured data
  tags             jsonb       not null default '[]'::jsonb,

  -- AI scoring
  match_score      integer     default 0 check (match_score >= 0 and match_score <= 100),

  -- User interaction flags
  applied_status   boolean     not null default false,
  saved_status     boolean     not null default false,

  -- Timestamps
  fetched_at       timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- ============================================================
-- 2. Indexes for common queries
-- ============================================================

-- Cache check: get jobs for a user fetched within the last N hours
create index if not exists jobs_user_fetched_idx
  on public.jobs (user_id, fetched_at desc);

-- Platform filter
create index if not exists jobs_user_platform_idx
  on public.jobs (user_id, platform);

-- Match score sorting
create index if not exists jobs_match_score_idx
  on public.jobs (user_id, match_score desc);

-- ============================================================
-- 3. Enable Row Level Security
-- ============================================================
alter table public.jobs enable row level security;

-- ============================================================
-- 4. RLS Policies
-- ============================================================

-- Users can view only their own jobs
create policy "Users can view own jobs"
  on public.jobs
  for select
  using (auth.uid() = user_id);

-- Users can insert their own jobs (API route uses service role, but this covers edge cases)
create policy "Users can insert own jobs"
  on public.jobs
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own jobs (for saved_status / applied_status)
create policy "Users can update own jobs"
  on public.jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own jobs
create policy "Users can delete own jobs"
  on public.jobs
  for delete
  using (auth.uid() = user_id);
