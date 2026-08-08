create table if not exists public.words (
  id text primary key,
  word text not null,
  category text not null,
  emoji text not null default '',
  meaning text not null default '',
  color text not null default '#ffd166',
  image_url text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists words_sort_order_idx on public.words (sort_order);
create index if not exists words_category_idx on public.words (category);

alter table public.words enable row level security;

drop policy if exists "words_public_read" on public.words;
drop policy if exists "words_public_update" on public.words;
drop policy if exists "words_public_insert" on public.words;

create policy "words_public_read"
on public.words for select
to anon
using (true);

create policy "words_public_update"
on public.words for update
to anon
using (true)
with check (true);

create policy "words_public_insert"
on public.words for insert
to anon
with check (true);

insert into storage.buckets (id, name, public)
values ('word-images', 'word-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "word_images_public_read" on storage.objects;
drop policy if exists "word_images_public_insert" on storage.objects;
drop policy if exists "word_images_public_update" on storage.objects;
drop policy if exists "word_images_public_delete" on storage.objects;

create policy "word_images_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'word-images');

create policy "word_images_public_insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'word-images');

create policy "word_images_public_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'word-images')
with check (bucket_id = 'word-images');

create policy "word_images_public_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'word-images');
