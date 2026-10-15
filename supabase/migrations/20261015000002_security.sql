-- BarberShop: privilegios, RLS y funciones de negocio.
-- Las escrituras sensibles (citas, existencias) solo ocurren mediante funciones que validan
-- identidad, permisos y datos. Las tablas no conceden escritura directa sobre esas columnas.

-- Privilegios por defecto: nada se expone a anon/authenticated sin una concesión explícita.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Funciones auxiliares ---------------------------------------------------------

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;
revoke all on function private.set_updated_at() from public;
revoke all on function private.prevent_movement_changes() from public;

-- Perfil automático al registrarse. El rol siempre es 'client'.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := nullif(btrim(new.raw_user_meta_data ->> 'phone'), '');
begin
  if v_phone is not null and v_phone !~ '^\+?[0-9 ()-]{7,20}$' then
    v_phone := null;
  end if;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    left(coalesce(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 100),
    v_phone,
    'client'
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- El rol solo puede cambiarse fuera de la API (SQL Editor / CLI), nunca desde una sesión de usuario.
create function private.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and (select auth.uid()) is not null then
    raise exception 'No está permitido cambiar el rol' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_profile_role() from public;

create trigger profiles_guard_role
before update on public.profiles
for each row execute function private.guard_profile_role();

alter table public.blocked_slots alter column created_by set default auth.uid();

-- RLS -------------------------------------------------------------------------

alter table public.business_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.working_hours enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

-- business_settings
grant select on public.business_settings to anon, authenticated;
grant update (
  slot_minutes,
  min_advance_minutes,
  booking_horizon_days,
  cancellation_min_hours,
  max_active_appointments_per_client
) on public.business_settings to authenticated;

create policy "Configuración visible" on public.business_settings
  for select to anon, authenticated using (true);
create policy "Admin actualiza configuración" on public.business_settings
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- profiles
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "Ver perfil propio o admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy "Actualizar perfil propio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- working_hours
grant select on public.working_hours to anon, authenticated;
grant insert (weekday, start_time, end_time, is_active),
      update (weekday, start_time, end_time, is_active),
      delete
  on public.working_hours to authenticated;

create policy "Horarios visibles" on public.working_hours
  for select to anon, authenticated using (true);
create policy "Admin crea horarios" on public.working_hours
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edita horarios" on public.working_hours
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin elimina horarios" on public.working_hours
  for delete to authenticated using ((select private.is_admin()));

-- blocked_slots
grant select, delete on public.blocked_slots to authenticated;
grant insert (starts_at, ends_at, reason),
      update (starts_at, ends_at, reason)
  on public.blocked_slots to authenticated;

create policy "Admin ve bloqueos" on public.blocked_slots
  for select to authenticated using ((select private.is_admin()));
create policy "Admin crea bloqueos" on public.blocked_slots
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edita bloqueos" on public.blocked_slots
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin elimina bloqueos" on public.blocked_slots
  for delete to authenticated using ((select private.is_admin()));

-- appointments: solo lectura directa; escrituras mediante funciones.
grant select on public.appointments to authenticated;

create policy "Ver citas propias o admin" on public.appointments
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_admin()));

-- inventory_items: la cantidad solo cambia mediante register_inventory_movement.
grant select on public.inventory_items to authenticated;
grant insert (name, unit, min_quantity, is_active),
      update (name, unit, min_quantity, is_active)
  on public.inventory_items to authenticated;
grant select on public.inventory_low_stock to authenticated;

create policy "Admin ve productos" on public.inventory_items
  for select to authenticated using ((select private.is_admin()));
create policy "Admin crea productos" on public.inventory_items
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edita productos" on public.inventory_items
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- inventory_movements: solo lectura; inserción mediante función.
grant select on public.inventory_movements to authenticated;

create policy "Admin ve movimientos" on public.inventory_movements
  for select to authenticated using ((select private.is_admin()));

-- Reservas --------------------------------------------------------------------

-- Horarios disponibles de un día local. Solo devuelve rangos de tiempo, sin datos de clientes.
create function public.get_available_slots(p_date date)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select * from public.business_settings where id
  ),
  candidates as (
    select
      ((p_date + wh.start_time) at time zone s.timezone)
        + make_interval(mins => g.n * s.slot_minutes) as slot_start,
      s.slot_minutes,
      s.min_advance_minutes,
      s.booking_horizon_days
    from s
    join public.working_hours wh
      on wh.is_active and wh.weekday = extract(isodow from p_date)::smallint
    cross join lateral generate_series(
      0,
      floor(extract(epoch from (wh.end_time - wh.start_time)) / 60 / s.slot_minutes)::int - 1
    ) as g (n)
  )
  select c.slot_start, c.slot_start + make_interval(mins => c.slot_minutes)
  from candidates c
  where c.slot_start >= now() + make_interval(mins => c.min_advance_minutes)
    and c.slot_start < now() + make_interval(days => c.booking_horizon_days)
    and not exists (
      select 1 from public.blocked_slots b
      where tstzrange(b.starts_at, b.ends_at, '[)')
        && tstzrange(c.slot_start, c.slot_start + make_interval(mins => c.slot_minutes), '[)')
    )
    and not exists (
      select 1 from public.appointments a
      where a.status in ('pending', 'confirmed')
        and tstzrange(a.starts_at, a.ends_at, '[)')
          && tstzrange(c.slot_start, c.slot_start + make_interval(mins => c.slot_minutes), '[)')
    )
  order by 1;
$$;

create function public.book_appointment(p_starts_at timestamptz, p_notes text default null)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_settings public.business_settings;
  v_ends_at timestamptz;
  v_active integer;
  v_row public.appointments;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para reservar' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'Perfil no encontrado' using errcode = '42501';
  end if;
  if p_notes is not null and char_length(p_notes) > 500 then
    raise exception 'Las notas no pueden superar 500 caracteres' using errcode = '22001';
  end if;

  -- Serializa las reservas: la disponibilidad se evalúa y se guarda sin carreras.
  perform pg_advisory_xact_lock(hashtextextended('barbershop:booking', 0));

  select * into v_settings from public.business_settings where id;

  select count(*) into v_active
  from public.appointments
  where client_id = v_uid and status in ('pending', 'confirmed') and ends_at > now();

  if v_active >= v_settings.max_active_appointments_per_client then
    raise exception 'Alcanzaste el máximo de % citas activas', v_settings.max_active_appointments_per_client
      using errcode = 'P0001';
  end if;

  select s.ends_at into v_ends_at
  from public.get_available_slots((p_starts_at at time zone v_settings.timezone)::date) s
  where s.starts_at = p_starts_at;

  if v_ends_at is null then
    raise exception 'El horario seleccionado no está disponible' using errcode = 'P0001';
  end if;

  insert into public.appointments (client_id, starts_at, ends_at, status, notes)
  values (v_uid, p_starts_at, v_ends_at, 'pending', nullif(btrim(p_notes), ''))
  returning * into v_row;

  return v_row;
exception
  when exclusion_violation then
    raise exception 'El horario seleccionado ya fue reservado' using errcode = 'P0001';
end;
$$;

-- Cancelación: el cliente solo cancela sus citas y con la antelación configurada; el admin, cualquiera.
create function public.cancel_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_admin boolean := private.is_admin();
  v_min_hours integer;
  v_row public.appointments;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '28000';
  end if;

  select * into v_row from public.appointments where id = p_appointment_id for update;

  if not found or (not v_is_admin and v_row.client_id <> v_uid) then
    raise exception 'Cita no encontrada' using errcode = 'P0002';
  end if;
  if v_row.status not in ('pending', 'confirmed') then
    raise exception 'Esta cita ya no se puede cancelar' using errcode = 'P0001';
  end if;

  if not v_is_admin then
    select cancellation_min_hours into v_min_hours from public.business_settings where id;
    if v_row.starts_at - now() < make_interval(hours => v_min_hours) then
      raise exception 'Solo puedes cancelar con al menos % horas de anticipación', v_min_hours
        using errcode = 'P0001';
    end if;
  end if;

  update public.appointments
  set status = 'cancelled', cancelled_at = now(), cancelled_by = v_uid
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

-- Cambios de estado reservados al administrador.
create function public.set_appointment_status(
  p_appointment_id uuid,
  p_status public.appointment_status
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.appointments;
begin
  if not private.is_admin() then
    raise exception 'Permiso denegado' using errcode = '42501';
  end if;

  if p_status = 'cancelled' then
    return public.cancel_appointment(p_appointment_id);
  end if;

  select * into v_row from public.appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'Cita no encontrada' using errcode = 'P0002';
  end if;

  if p_status = 'confirmed' and v_row.status <> 'pending' then
    raise exception 'Solo se pueden confirmar citas pendientes' using errcode = 'P0001';
  elsif p_status = 'completed' and (v_row.status not in ('pending', 'confirmed') or v_row.starts_at > now()) then
    raise exception 'Solo se pueden completar citas activas que ya comenzaron' using errcode = 'P0001';
  elsif p_status = 'pending' then
    raise exception 'Transición de estado no permitida' using errcode = 'P0001';
  end if;

  update public.appointments set status = p_status
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

-- Citas futuras activas que quedaron fuera del horario laboral o dentro de un bloqueo.
create function public.admin_unschedulable_appointments()
returns table (
  appointment_id uuid,
  client_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.appointment_status,
  reason text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Permiso denegado' using errcode = '42501';
  end if;

  return query
  with s as (select timezone from public.business_settings where id)
  select a.id, a.client_id, a.starts_at, a.ends_at, a.status,
    case
      when exists (
        select 1 from public.blocked_slots b
        where tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(a.starts_at, a.ends_at, '[)')
      ) then 'blocked'
      else 'outside_hours'
    end
  from public.appointments a
  cross join s
  where a.status in ('pending', 'confirmed')
    and a.ends_at > now()
    and (
      exists (
        select 1 from public.blocked_slots b
        where tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(a.starts_at, a.ends_at, '[)')
      )
      or not exists (
        select 1 from public.working_hours wh
        where wh.is_active
          and wh.weekday = extract(isodow from (a.starts_at at time zone s.timezone))::smallint
          and (a.starts_at at time zone s.timezone)::time >= wh.start_time
          and (a.ends_at at time zone s.timezone)
            <= (a.starts_at at time zone s.timezone)::date + wh.end_time
      )
    )
  order by a.starts_at;
end;
$$;

-- Inventario ------------------------------------------------------------------

-- Entrada/salida: p_quantity es la cantidad movida (> 0).
-- Ajuste: p_quantity es la existencia real contada (>= 0) y requiere motivo.
create function public.register_inventory_movement(
  p_item_id uuid,
  p_type public.inventory_movement_type,
  p_quantity numeric,
  p_reason text default null
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.inventory_items;
  v_quantity numeric(12, 2) := round(p_quantity, 2);
  v_reason text := nullif(btrim(p_reason), '');
  v_delta numeric(12, 2);
  v_row public.inventory_movements;
begin
  if not private.is_admin() then
    raise exception 'Permiso denegado' using errcode = '42501';
  end if;
  if v_quantity is null or v_quantity < 0 or (p_type <> 'adjustment' and v_quantity = 0) then
    raise exception 'Cantidad inválida' using errcode = '22023';
  end if;
  if p_type = 'adjustment' and v_reason is null then
    raise exception 'Los ajustes requieren un motivo' using errcode = '22023';
  end if;
  if v_reason is not null and char_length(v_reason) > 300 then
    raise exception 'El motivo no puede superar 300 caracteres' using errcode = '22001';
  end if;

  -- Bloquea la fila: movimientos concurrentes del mismo producto se aplican en serie.
  select * into v_item from public.inventory_items where id = p_item_id for update;
  if not found then
    raise exception 'Producto no encontrado' using errcode = 'P0002';
  end if;
  if not v_item.is_active then
    raise exception 'El producto está desactivado' using errcode = 'P0001';
  end if;

  v_delta := case p_type
    when 'entry' then v_quantity
    when 'exit' then -v_quantity
    else v_quantity - v_item.quantity
  end;

  if v_delta = 0 then
    raise exception 'El ajuste no cambia la existencia actual' using errcode = 'P0001';
  end if;
  if v_item.quantity + v_delta < 0 then
    raise exception 'Existencias insuficientes (disponible: %)', v_item.quantity using errcode = 'P0001';
  end if;

  update public.inventory_items set quantity = quantity + v_delta where id = p_item_id;

  insert into public.inventory_movements (item_id, type, quantity_delta, quantity_after, reason, performed_by)
  values (p_item_id, p_type, v_delta, v_item.quantity + v_delta, v_reason, (select auth.uid()))
  returning * into v_row;

  return v_row;
end;
$$;

-- Permisos de ejecución --------------------------------------------------------

revoke all on function public.get_available_slots(date) from public, anon;
revoke all on function public.book_appointment(timestamptz, text) from public, anon;
revoke all on function public.cancel_appointment(uuid) from public, anon;
revoke all on function public.set_appointment_status(uuid, public.appointment_status) from public, anon;
revoke all on function public.admin_unschedulable_appointments() from public, anon;
revoke all on function public.register_inventory_movement(uuid, public.inventory_movement_type, numeric, text) from public, anon;

grant execute on function public.get_available_slots(date) to authenticated;
grant execute on function public.book_appointment(timestamptz, text) to authenticated;
grant execute on function public.cancel_appointment(uuid) to authenticated;
grant execute on function public.set_appointment_status(uuid, public.appointment_status) to authenticated;
grant execute on function public.admin_unschedulable_appointments() to authenticated;
grant execute on function public.register_inventory_movement(uuid, public.inventory_movement_type, numeric, text) to authenticated;
