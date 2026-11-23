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

    if not room_is_active and p_new_status = 'ocupada' then
      raise exception 'No se puede marcar como ocupada una habitación desactivada.';
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
    p_room_id,
    current_status,
    p_new_status,
    actor_id,
    nullif(trim(p_reason), '')
  );
end;
$$;
