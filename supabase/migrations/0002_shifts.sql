create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  role public.app_role not null,
  opened_at timestamptz not null default now(),
  opened_by uuid not null references public.profiles (id) on delete restrict,
  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete restrict,
  constraint shifts_close_fields_match check (
    (closed_at is null and closed_by is null)
    or (closed_at is not null and closed_by is not null and closed_at >= opened_at)
  )
);

alter table public.profiles
  add column reauth_required boolean not null default false;

create unique index shifts_one_open_per_person
  on public.shifts (user_id)
  where closed_at is null;

create unique index shifts_one_open_reception_globally
  on public.shifts (role)
  where role in ('recepcion', 'admin') and closed_at is null;

create index shifts_opened_at_idx on public.shifts (opened_at desc);

alter table public.shifts enable row level security;
revoke all on public.shifts from anon, authenticated;
grant select on public.shifts to authenticated;

create policy "Users can read their shifts and admins can read all"
on public.shifts
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.has_role('admin'::public.app_role))
);

create or replace function public.open_my_shift()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_app_role public.app_role;
  new_shift_id uuid;
begin
  select p.role into user_app_role
  from public.profiles as p
  where p.id = (select auth.uid())
    and p.active = true
    and p.reauth_required = false;

  if user_app_role is null then
    raise exception 'No se pudo identificar el rol activo para abrir un turno.';
  end if;

  insert into public.shifts (user_id, role, opened_by)
  values ((select auth.uid()), user_app_role, (select auth.uid()))
  returning id into new_shift_id;

  return new_shift_id;
end;
$$;

create or replace function public.close_my_shift()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  closed_shift_id uuid;
begin
  update public.shifts
  set closed_at = now(),
      closed_by = (select auth.uid())
  where user_id = (select auth.uid())
    and closed_at is null
  returning id into closed_shift_id;

  if closed_shift_id is null then
    raise exception 'No tienes un turno abierto para cerrar.';
  end if;

  update public.profiles
  set reauth_required = true
  where id = (select auth.uid());

  return closed_shift_id;
end;
$$;

create or replace function public.admin_close_shift(target_shift_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if not exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.active = true
      and p.reauth_required = false
  ) then
    raise exception 'Solo un administrador activo puede cerrar turnos.';
  end if;

  update public.shifts
  set closed_at = now(),
      closed_by = (select auth.uid())
  where id = target_shift_id
    and closed_at is null
  returning user_id into target_user_id;

  if target_user_id is null then
    raise exception 'El turno no existe o ya está cerrado.';
  end if;

  update public.profiles
  set reauth_required = true
  where id = target_user_id;

  return target_user_id;
end;
$$;

create or replace function public.has_open_reception_shift()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shifts as s
    join public.profiles as p on p.id = s.user_id
    where s.user_id = (select auth.uid())
      and s.role = 'recepcion'
      and s.closed_at is null
      and p.role = 'recepcion'
      and p.active = true
      and p.reauth_required = false
  );
$$;

revoke all on function public.open_my_shift() from public;
revoke all on function public.close_my_shift() from public;
revoke all on function public.admin_close_shift(uuid) from public;
revoke all on function public.has_open_reception_shift() from public;

grant execute on function public.open_my_shift() to authenticated;
grant execute on function public.close_my_shift() to authenticated;
grant execute on function public.admin_close_shift(uuid) to authenticated;
grant execute on function public.has_open_reception_shift() to authenticated;
