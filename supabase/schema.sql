-- =========================================================
-- Kurbağa Felsefesi — Supabase şeması
-- ---------------------------------------------------------
-- Supabase → SQL Editor içinde çalıştır.
-- Anonim ziyaretçiler notları okuyabilir ve not ekleyebilir;
-- güncelleme/silme yetkisi verilmez.
-- =========================================================

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  nickname text,
  body text not null,
  created_at timestamptz not null default now(),
  constraint notes_body_len check (char_length(btrim(body)) between 1 and 480),
  constraint notes_nickname_len check (
    nickname is null
    or (char_length(btrim(nickname)) between 1 and 24)
  )
);

create index if not exists notes_created_at_idx
  on public.notes (created_at desc);

alter table public.notes enable row level security;

drop policy if exists "herkes notları okuyabilir" on public.notes;
create policy "herkes notları okuyabilir"
  on public.notes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "herkes not bırakabilir" on public.notes;
create policy "herkes not bırakabilir"
  on public.notes
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(body)) between 1 and 480
    and (
      nickname is null
      or (char_length(btrim(nickname)) between 1 and 24)
    )
  );

-- Anonim anahtar yalnızca okuma ve ekleme yapabilsin.
revoke all on public.notes from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert on public.notes to anon, authenticated;