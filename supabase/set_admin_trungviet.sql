insert into public.profiles (id, email, role)
select id, lower(email), 'admin'
from auth.users
where lower(email) = 'trungvietnguyen0@gmail.com'
on conflict (id) do update set
  email = excluded.email,
  role = 'admin',
  updated_at = now();
