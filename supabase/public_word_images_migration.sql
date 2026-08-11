drop policy if exists "words_public_read" on public.words;
drop policy if exists "words_guest_read_15" on public.words;
drop policy if exists "words_user_read_by_role" on public.words;

create policy "words_public_read"
on public.words for select
to anon, authenticated
using (true);

insert into public.app_settings (key, value)
values ('guest_donate_card', '{"enabled": true, "interval": 2}'::jsonb)
on conflict (key) do nothing;
