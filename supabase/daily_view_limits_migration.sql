-- Switch guest/free limits from database word slicing to app-level daily view quotas.
-- Run this once in Supabase SQL Editor for existing projects.

alter table public.words enable row level security;

drop policy if exists "words_public_read" on public.words;
drop policy if exists "words_guest_read_15" on public.words;
drop policy if exists "words_user_read_by_role" on public.words;
drop policy if exists "words_public_read_all" on public.words;

create policy "words_public_read_all"
on public.words for select
to anon, authenticated
using (true);
