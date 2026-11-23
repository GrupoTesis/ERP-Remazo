do $$
begin
  create type public.room_status as enum ('disponible', 'ocupada', 'limpieza');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number smallint not null unique
    check (room_number between 1 and 6),
  name text not null,
  active boolean not null default true,
  status public.room_status not null default 'disponible'
);

create table if not exists public.room_rates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  duration_minutes integer not null
    check (duration_minutes >= 30 and duration_minutes % 30 = 0),
  price numeric(10, 2) not null check (price >= 0),
  valid_from timestamptz not null default clock_timestamp(),
  valid_to timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  check (valid_to is null or valid_to > valid_from)
);

create unique index if not exists room_rates_one_current_per_duration
  on public.room_rates (room_id, duration_minutes)
  where valid_to is null;

create table if not exists public.room_status_history (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  from_status public.room_status not null,
  to_status public.room_status not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  reason text,
  changed_at timestamptz not null default clock_timestamp()
);

create index if not exists room_status_history_room_date
  on public.room_status_history (room_id, changed_at desc);

insert into public.rooms (room_number, name)
values
  (1, 'Habitación 1'),
  (2, 'Habitación 2'),
  (3, 'Habitación 3'),
  (4, 'Habitación 4'),
  (5, 'Habitación 5'),
  (6, 'Habitación 6')
on conflict (room_number) do nothing;

alter table public.rooms enable row level security;
alter table public.room_rates enable row level security;
alter table public.room_status_history enable row level security;

drop policy if exists rooms_read_active_users on public.rooms;
create policy rooms_read_active_users
  on public.rooms for select to authenticated
  using ((select public.is_active_user()));

drop policy if exists rooms_admin_update on public.rooms;
create policy rooms_admin_update
  on public.rooms for update to authenticated
  using ((select public.has_role('admin'::public.app_role)))
  with check ((select public.has_role('admin'::public.app_role)));

drop policy if exists room_rates_read_admin_reception on public.room_rates;
create policy room_rates_read_admin_reception
  on public.room_rates for select to authenticated
  using (
    (select public.has_role('admin'::public.app_role))
    or (select public.has_role('recepcion'::public.app_role))
  );

drop policy if exists room_history_read_active_users on public.room_status_history;
create policy room_history_read_active_users
  on public.room_status_history for select to authenticated
  using ((select public.is_active_user()));

revoke all on public.rooms, public.room_rates, public.room_status_history
  from anon, authenticated;

grant select on public.rooms, public.room_status_history to authenticated;
grant update (room_number, name) on public.rooms to authenticated;
grant select on public.room_rates to authenticated;

create or replace function public.set_room_rate(
  p_room_id uuid,
  p_duration_minutes integer,
  p_price numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.app_role;
  new_rate_id uuid;
  change_time timestamptz := clock_timestamp();
begin
  select p.role into actor_role
  from public.profiles as p
  where p.id = actor_id
    and p.active = true
    and p.reauth_required = false;

  if actor_role is distinct from 'admin'::public.app_role then
    raise exception 'Solo un administrador activo puede configurar tarifas.';
  end if;

  if p_duration_minutes is null
    or p_duration_minutes < 30
    or p_duration_minutes > 1440
    or p_duration_minutes % 30 <> 0 then
    raise exception 'La duración debe estar entre 30 minutos y 24 horas, en intervalos de 30 minutos.';
  end if;

  if p_price is null or p_price < 0 then
    raise exception 'El precio no puede ser negativo.';
  end if;

  perform 1
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'La habitación no existe.';
  end if;

  update public.room_rates
  set valid_to = change_time
  where room_id = p_room_id
    and duration_minutes = p_duration_minutes
    and valid_to is null;

  insert into public.room_rates (
    room_id, duration_minutes, price, valid_from, created_by
  )
  values (
    p_room_id, p_duration_minutes, p_price, change_time, actor_id
  )
  returning id into new_rate_id;

  return new_rate_id;
end;
$$;

create or replace function public.set_room_active(
  p_room_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.app_role;
  current_status public.room_status;
begin
  select p.role into actor_role
  from public.profiles as p
  where p.id = auth.uid()
    and p.active = true
    and p.reauth_required = false;

  if actor_role is distinct from 'admin'::public.app_role then
    raise exception 'Solo un administrador activo puede activar o desactivar habitaciones.';
  end if;

  if p_active is null then
    raise exception 'Debes indicar si la habitación se activa o desactiva.';
  end if;

  select r.status into current_status
  from public.rooms as r
  where r.id = p_room_id
  for update;

  if not found then
    raise exception 'La habitación no existe.';
  end if;

  if p_active = false and current_status <> 'disponible' then
    raise exception 'Solo se puede desactivar una habitación disponible.';
  end if;

  update public.rooms
  set active = p_active
  where id = p_room_id;
end;
$$;

create or replace function public.change_room_status(
  p_room_id uuid,
  p_new_status public.room_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.app_role;
  current_status public.room_status;
  room_is_active boolean;
begin
  select p.role into actor_role
  from public.profiles as p
  where p.id = actor_id
    and p.active = true
    and p.reauth_required = false;

  if actor_role is null then
    raise exception 'No se pudo verificar un usuario activo.';
  end if;

  select r.status, r.active
    into current_status, room_is_active
  from public.rooms as r
  where r.id = p_room_id
  for update;

  if not found then
    raise exception 'La habitación no existe.';
  end if;

  if p_new_status is null or current_status = p_new_status then
    raise exception 'La transición seleccionada no es válida.';
  end if;

  if actor_role = 'admin'::public.app_role then
    if nullif(trim(p_reason), '') is null then
      raise exception 'El administrador debe indicar el motivo de la corrección.';
    end if;

    if not (
      (current_status = 'disponible' and p_new_status = 'ocupada')
      or (current_status = 'ocupada' and p_new_status = 'limpieza')
      or (current_status = 'limpieza' and p_new_status = 'disponible')
    ) then
      raise exception 'La corrección administrativa debe respetar el ciclo disponible, ocupada, limpieza y disponible.';
    end if;
  elsif not room_is_active then
    raise exception 'La habitación está desactivada.';
  elsif actor_role = 'recepcion'::public.app_role then
    if not (
      (current_status = 'disponible' and p_new_status = 'ocupada')
      or (current_status = 'ocupada' and p_new_status = 'limpieza')
    ) then
      raise exception 'Transición no permitida para recepción.';
    end if;

    if not public.has_open_reception_shift() then
      raise exception 'Se requiere un turno de recepción abierto.';
    end if;
  elsif actor_role = 'limpieza'::public.app_role then
    if not (
      current_status = 'limpieza' and p_new_status = 'disponible'
    ) then
      raise exception 'Transición no permitida para limpieza.';
    end if;

    if not exists (
      select 1
      from public.shifts as s
      where s.user_id = actor_id
        and s.role = 'limpieza'::public.app_role
        and s.closed_at is null
    ) then
      raise exception 'Se requiere un turno de limpieza abierto.';
    end if;
  else
    raise exception 'El rol no puede cambiar el estado de habitaciones.';
  end if;

  update public.rooms
  set status = p_new_status
  where id = p_room_id;

  insert into public.room_status_history (
    room_id, from_status, to_status, changed_by, reason
  )
  values (
    p_room_id, current_status, p_new_status, actor_id, nullif(trim(p_reason), '')
  );
end;
$$;

revoke all on function public.set_room_rate(uuid, integer, numeric) from public, anon;
revoke all on function public.set_room_active(uuid, boolean) from public, anon;
revoke all on function public.change_room_status(uuid, public.room_status, text)
  from public, anon;

grant execute on function public.set_room_rate(uuid, integer, numeric) to authenticated;
grant execute on function public.set_room_active(uuid, boolean) to authenticated;
grant execute on function public.change_room_status(uuid, public.room_status, text)
  to authenticated;
