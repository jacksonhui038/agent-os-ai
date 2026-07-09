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
-- 完成！之後喺 config.js 填 Project URL + anon key 就可用。
-- 同事用 email + 密碼註冊/登入，資料自動隔離同雲端同步。
-- ============================================================
