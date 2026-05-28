-- JobStock AI Supabase schema
-- Run this in the Supabase SQL Editor before using cloud sync.
-- If you already ran an older draft schema and have no important data yet,
-- reset the old JobStock tables first, then run this file again.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry text not null default '',
  job_type text not null default '',
  status text not null default 'preparing',
  priority text not null default 'medium',
  next_interview date,
  es_deadline date,
  entry_deadline date,
  memo text not null default '',
  answers jsonb not null default '{"motivation":"","selfPr":"","gakuchika":""}',
  tasks jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  phase text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_answers (
  id text primary key,
  post_id text not null references public.forum_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null default '匿名ユーザー',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_answers enable row level security;
alter table public.ai_logs enable row level security;

drop policy if exists "profiles are readable by owner" on public.profiles;
drop policy if exists "profiles are writable by owner" on public.profiles;
drop policy if exists "companies are private" on public.companies;
drop policy if exists "forum posts are public readable" on public.forum_posts;
drop policy if exists "forum posts require login" on public.forum_posts;
drop policy if exists "forum posts can update own rows" on public.forum_posts;
drop policy if exists "forum answers are public readable" on public.forum_answers;
drop policy if exists "forum answers require login" on public.forum_answers;
drop policy if exists "forum answers can update own rows" on public.forum_answers;
drop policy if exists "ai logs are private" on public.ai_logs;

create policy "profiles are readable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are writable by owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "companies are private" on public.companies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "forum posts are public readable" on public.forum_posts
  for select using (true);

create policy "forum posts require login" on public.forum_posts
  for insert with check (auth.uid() = user_id);

create policy "forum posts can update own rows" on public.forum_posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "forum answers are public readable" on public.forum_answers
  for select using (true);

create policy "forum answers require login" on public.forum_answers
  for insert with check (auth.uid() = user_id);

create policy "forum answers can update own rows" on public.forum_answers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ai logs are private" on public.ai_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.forum_posts;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.forum_answers;
exception
  when duplicate_object then null;
end $$;
