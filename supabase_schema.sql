-- ============================================================
-- Agent OS AI — Supabase Schema
-- 喺 Supabase Dashboard → SQL Editor 貼入 run 一次
-- 用途：俾每位同事各自登入，客戶/歷史資料按 user 隔離
-- ============================================================

-- ---------- 1. clients 表 ----------
create table if not exists public.clients (
  id          text primary key,
  owner       uuid not null references auth.users (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- 2. history 表 ----------
create table if not exists public.history (
  id          text primary key,
  owner       uuid not null references auth.users (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------- 3. 開 RLS（行級安全）----------
alter table public.clients enable row level security;
alter table public.history enable row level security;

-- 每位用戶只可以睇/改自己嘅資料
drop policy if exists "clients_owner_all" on public.clients;
create policy "clients_owner_all" on public.clients
  for all using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "history_owner_all" on public.history;
create policy "history_owner_all" on public.history
  for all using (owner = auth.uid()) with check (owner = auth.uid());

-- ---------- 4. 性能 index ----------
create index if not exists clients_owner_idx on public.clients (owner);
create index if not exists history_owner_idx on public.history (owner);

-- ============================================================
-- 5. team_posts 表（全組共享「已發佈」記錄，避免重覆）
-- ============================================================
create table if not exists public.team_posts (
  id          text primary key,
  owner       uuid not null references auth.users (id) on delete cascade,
  user_email  text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.team_posts enable row level security;

-- 所有已登入用戶都可以讀取全組記錄；只可以修改自己嘅記錄
drop policy if exists "team_posts_select_all" on public.team_posts;
create policy "team_posts_select_all" on public.team_posts
  for select using (auth.role() = 'authenticated');

drop policy if exists "team_posts_owner_insert" on public.team_posts;
create policy "team_posts_owner_insert" on public.team_posts
  for insert with check (owner = auth.uid());

drop policy if exists "team_posts_owner_delete" on public.team_posts;
create policy "team_posts_owner_delete" on public.team_posts
  for delete using (owner = auth.uid());

create index if not exists team_posts_owner_idx on public.team_posts (owner);
create index if not exists team_posts_data_topic_idx on public.team_posts ((data->>'topic'));

-- ============================================================
-- 完成！之後喺 config.js 填 Project URL + anon key 就可用。
-- 同事用 email + 密碼註冊/登入，資料自動隔離同雲端同步。
-- ============================================================
