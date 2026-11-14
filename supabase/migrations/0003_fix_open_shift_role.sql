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
