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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'free' check (role in ('free', 'paid', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists words_sort_order_idx on public.words (sort_order);
create index if not exists words_category_idx on public.words (category);
create index if not exists profiles_role_idx on public.profiles (role);

create schema if not exists private;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = (select auth.uid())),
    'guest'
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.current_user_role() to anon, authenticated;

create or replace function private.role_word_limit(role_name text)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  raw_value text;
  limit_value integer;
begin
  select value ->> role_name
  into raw_value
  from public.app_settings
  where key = 'role_limits';

  if raw_value is null or raw_value !~ '^[0-9]+$' then
    return case
      when role_name = 'guest' then 15
      when role_name = 'free' then 100
      else 2147483647
    end;
  end if;

  limit_value := raw_value::integer;
  if limit_value <= 0 then
    return 2147483647;
  end if;
  return limit_value;
end;
$$;

grant execute on function private.role_word_limit(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    lower(new.email),
    case
      when lower(new.email) = 'trungvietnguyen0@gmail.com' then 'admin'
      else 'free'
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case
      when excluded.email = 'trungvietnguyen0@gmail.com' then 'admin'
      else public.profiles.role
    end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, role)
select
  id,
  lower(email),
  case
    when lower(email) = 'trungvietnguyen0@gmail.com' then 'admin'
    else 'free'
  end
from auth.users
where email is not null
on conflict (id) do update set
  email = excluded.email,
  role = case
    when excluded.email = 'trungvietnguyen0@gmail.com' then 'admin'
    else public.profiles.role
  end,
  updated_at = now();

alter table public.words enable row level security;
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "words_public_read" on public.words;
drop policy if exists "words_public_update" on public.words;
drop policy if exists "words_public_insert" on public.words;
drop policy if exists "words_guest_read_15" on public.words;
drop policy if exists "words_user_read_by_role" on public.words;
drop policy if exists "words_admin_insert" on public.words;
drop policy if exists "words_admin_update" on public.words;
drop policy if exists "words_admin_delete" on public.words;

create policy "words_guest_read_15"
on public.words for select
to anon
using (sort_order < private.role_word_limit('guest'));

create policy "words_user_read_by_role"
on public.words for select
to authenticated
using (
  private.current_user_role() = 'admin'
  or sort_order < private.role_word_limit(private.current_user_role())
);

create policy "words_admin_insert"
on public.words for insert
to authenticated
with check (private.current_user_role() = 'admin');

create policy "words_admin_update"
on public.words for update
to authenticated
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

create policy "words_admin_delete"
on public.words for delete
to authenticated
using (private.current_user_role() = 'admin');

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

create policy "profiles_select_self_or_admin"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or private.current_user_role() = 'admin'
);

create policy "profiles_update_admin"
on public.profiles for update
to authenticated
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

drop policy if exists "app_settings_public_read" on public.app_settings;
drop policy if exists "app_settings_admin_insert" on public.app_settings;
drop policy if exists "app_settings_admin_update" on public.app_settings;
drop policy if exists "app_settings_admin_delete" on public.app_settings;

create policy "app_settings_public_read"
on public.app_settings for select
to anon, authenticated
using (true);

create policy "app_settings_admin_insert"
on public.app_settings for insert
to authenticated
with check (private.current_user_role() = 'admin');

create policy "app_settings_admin_update"
on public.app_settings for update
to authenticated
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

create policy "app_settings_admin_delete"
on public.app_settings for delete
to authenticated
using (private.current_user_role() = 'admin');

insert into public.app_settings (key, value)
values ('speech', '{"rate": 0.65, "volume": 1, "voiceURI": ""}'::jsonb)
on conflict (key) do nothing;

insert into public.app_settings (key, value)
values ('role_limits', '{"guest": 15, "free": 100, "paid": 0, "admin": 0}'::jsonb)
on conflict (key) do nothing;

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
