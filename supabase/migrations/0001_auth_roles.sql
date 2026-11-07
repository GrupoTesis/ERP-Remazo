create type public.app_role as enum ('admin', 'recepcion', 'limpieza');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = required_role
      and active = true
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and active = true
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
revoke all on function public.is_active_user() from public;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_active_user() to authenticated;

grant select on public.profiles to authenticated;

create policy "Users can read their own profile or admins can read all"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select public.has_role('admin'::public.app_role))
);
