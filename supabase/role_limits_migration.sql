create schema if not exists private;
grant usage on schema private to anon, authenticated;

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

insert into public.app_settings (key, value)
values ('role_limits', '{"guest": 15, "free": 100, "paid": 0, "admin": 0}'::jsonb)
on conflict (key) do nothing;

drop policy if exists "words_guest_read_15" on public.words;
drop policy if exists "words_user_read_by_role" on public.words;

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
