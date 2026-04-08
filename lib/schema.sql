-- LinkedIn ICP Scraper - Supabase Schema

-- Runs: each batch of LinkedIn posts submitted
create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'pending',
  post_urls text[] not null default '{}',
  total_posts integer not null default 0,
  total_profiles integer not null default 0,
  evaluated_profiles integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Profiles: enriched LinkedIn profiles (deduplicated by linkedin_url)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  linkedin_url text not null unique,
  first_name text,
  last_name text,
  full_name text,
  headline text,
  job_title text,
  seniority text,
  location text,
  company_name text,
  company_linkedin_url text,
  company_size text,
  employee_count integer,
  industry text,
  connections integer,
  about text,
  profile_image text,
  is_fortune_500 boolean not null default false,
  raw_enrichment jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Run <-> Profile junction (tracks which profiles appeared in which runs)
create table if not exists run_profiles (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  source_post_url text not null default '',
  created_at timestamptz not null default now(),
  unique(run_id, profile_id, source_post_url)
);

-- ICP Evaluations: AI scoring results per profile per run
create table if not exists icp_evaluations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  run_id uuid not null references runs(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 10),
  is_icp boolean not null default false,
  reasoning text not null default '',
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  evaluated_at timestamptz not null default now(),
  unique(profile_id, run_id)
);

-- ICP Settings: editable prompt and configuration
create table if not exists icp_settings (
  id uuid primary key default gen_random_uuid(),
  prompt text not null default '',
  mode text not null default 'scoring',
  score_threshold integer not null default 7,
  updated_at timestamptz not null default now()
);

-- Insert default settings row
insert into icp_settings (prompt, mode, score_threshold)
values ('', 'scoring', 7)
on conflict do nothing;

-- Indexes for performance
create index if not exists idx_run_profiles_run_id on run_profiles(run_id);
create index if not exists idx_run_profiles_profile_id on run_profiles(profile_id);
create index if not exists idx_icp_evaluations_profile_id on icp_evaluations(profile_id);
create index if not exists idx_icp_evaluations_run_id on icp_evaluations(run_id);
create index if not exists idx_profiles_company_name on profiles(company_name);
create index if not exists idx_profiles_seniority on profiles(seniority);
create index if not exists idx_profiles_is_fortune_500 on profiles(is_fortune_500);
