insert into storage.buckets (id, name, public)
values ('word-images', 'word-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "word_images_public_read" on storage.objects;
drop policy if exists "word_images_public_insert" on storage.objects;
drop policy if exists "word_images_public_update" on storage.objects;
drop policy if exists "word_images_public_delete" on storage.objects;
drop policy if exists "word_images_admin_insert" on storage.objects;
drop policy if exists "word_images_admin_update" on storage.objects;
drop policy if exists "word_images_admin_delete" on storage.objects;

create policy "word_images_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'word-images');

create policy "word_images_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'word-images'
  and private.current_user_role() = 'admin'
);

create policy "word_images_admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'word-images'
  and private.current_user_role() = 'admin'
)
with check (
  bucket_id = 'word-images'
  and private.current_user_role() = 'admin'
);

create policy "word_images_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'word-images'
  and private.current_user_role() = 'admin'
);
