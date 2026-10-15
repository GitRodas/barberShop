-- Comprobaciones de seguridad y reglas de negocio.
-- Se ejecuta en un único bloque que SIEMPRE termina con una excepción, por lo que
-- ningún dato de prueba persiste. Resultado esperado: "CHECKS_PASSED: 24".
--
--   npx supabase db query --linked -f supabase/checks/security_checks.sql

do $checks$
declare
  tz constant text := 'America/Bogota';
  v_day date := (now() at time zone 'America/Bogota')::date + 1;
  v_dow smallint := extract(isodow from ((now() at time zone 'America/Bogota')::date + 1))::smallint;
  u_a uuid := gen_random_uuid();
  u_b uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  v_appt public.appointments;
  v_appt2 public.appointments;
  v_item uuid;
  v_mov public.inventory_movements;
  v_count integer;
  v_qty numeric;
  v_passed integer := 0;
begin
  -- Preparación (como postgres) -------------------------------------------------
  update public.profiles set role = 'client' where role = 'admin';
  delete from public.working_hours;
  delete from public.blocked_slots;
  update public.business_settings
  set slot_minutes = 30, min_advance_minutes = 0, booking_horizon_days = 30,
      cancellation_min_hours = 2, max_active_appointments_per_client = 2;

  insert into auth.users (id, email, aud, role, raw_user_meta_data) values
    (u_a, 'a-' || u_a || '@test.local', 'authenticated', 'authenticated',
      '{"full_name":"Cliente A","phone":"3001234567"}'),
    (u_b, 'b-' || u_b || '@test.local', 'authenticated', 'authenticated',
      '{"full_name":"Cliente B","phone":"no-valido"}'),
    (u_admin, 'admin-' || u_admin || '@test.local', 'authenticated', 'authenticated',
      '{"full_name":"Barbero"}');

  select count(*) into v_count from public.profiles
  where id in (u_a, u_b, u_admin) and role = 'client';
  if v_count <> 3 then raise exception 'FALLO perfiles automáticos'; end if;
  if (select phone from public.profiles where id = u_b) is not null then
    raise exception 'FALLO teléfono inválido aceptado en registro';
  end if;
  v_passed := v_passed + 1;

  -- El administrador se asigna manualmente (sin sesión de usuario).
  update public.profiles set role = 'admin' where id = u_admin;
  begin
    update public.profiles set role = 'admin' where id = u_a;
    raise exception 'FALLO se permitió un segundo admin' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  insert into public.working_hours (weekday, start_time, end_time) values
    (v_dow, '09:00', '12:00'),
    (v_dow, '14:00', '18:00');

  begin
    insert into public.working_hours (weekday, start_time, end_time) values (v_dow, '11:00', '15:00');
    raise exception 'FALLO intervalos solapados aceptados' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Cliente A ---------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_count from public.profiles;
  if v_count <> 1 then raise exception 'FALLO cliente ve % perfiles', v_count; end if;
  v_passed := v_passed + 1;

  begin
    update public.profiles set role = 'admin' where id = u_a;
    raise exception 'FALLO cliente cambió su rol' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  update public.profiles set full_name = 'Cliente A2' where id = u_a;
  update public.profiles set full_name = 'Hackeado' where id = u_b;
  v_passed := v_passed + 1;

  begin
    insert into public.appointments (client_id, starts_at, ends_at)
    values (u_a, (v_day + time '09:00') at time zone tz, (v_day + time '09:30') at time zone tz);
    raise exception 'FALLO inserción directa de cita' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    insert into public.working_hours (weekday, start_time, end_time) values (v_dow, '19:00', '20:00');
    raise exception 'FALLO cliente creó horario' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    insert into public.blocked_slots (starts_at, ends_at) values (now(), now() + interval '1 hour');
    raise exception 'FALLO cliente creó bloqueo' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    update public.business_settings set cancellation_min_hours = 0;
    get diagnostics v_count = row_count;
    if v_count > 0 then raise exception 'FALLO cliente cambió configuración' using errcode = 'T0001'; end if;
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  select count(*) into v_count from public.get_available_slots(v_day);
  if v_count <> 14 then raise exception 'FALLO se esperaban 14 horarios y hay %', v_count; end if;
  v_passed := v_passed + 1;

  -- Fuera de horario, en el descanso y desalineado.
  begin
    perform public.book_appointment((v_day + time '07:00') at time zone tz);
    raise exception 'FALLO reserva fuera de horario' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.book_appointment((v_day + time '12:30') at time zone tz);
    raise exception 'FALLO reserva durante descanso' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.book_appointment((v_day + time '09:10') at time zone tz);
    raise exception 'FALLO reserva desalineada' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.book_appointment(now() - interval '1 day');
    raise exception 'FALLO reserva en el pasado' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  v_appt := public.book_appointment((v_day + time '09:00') at time zone tz, 'Corte clásico');
  if v_appt.status <> 'pending' or v_appt.client_id <> u_a
     or v_appt.ends_at - v_appt.starts_at <> interval '30 minutes' then
    raise exception 'FALLO reserva válida con datos incorrectos';
  end if;
  begin
    perform public.set_appointment_status(v_appt.id, 'confirmed');
    raise exception 'FALLO cliente confirmó su cita' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    update public.appointments set status = 'confirmed' where id = v_appt.id;
    raise exception 'FALLO cliente actualizó cita directamente' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  v_appt2 := public.book_appointment((v_day + time '09:30') at time zone tz);
  begin
    perform public.book_appointment((v_day + time '14:00') at time zone tz);
    raise exception 'FALLO se superó el máximo de citas activas' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Cliente B ---------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.appointments;
  if v_count <> 0 then raise exception 'FALLO cliente B ve citas ajenas'; end if;
  if (select full_name from public.profiles where id = u_b) = 'Hackeado' then
    raise exception 'FALLO cliente A modificó perfil ajeno';
  end if;
  begin
    perform public.cancel_appointment(v_appt.id);
    raise exception 'FALLO cliente B canceló cita ajena' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.book_appointment((v_day + time '09:00') at time zone tz);
    raise exception 'FALLO reserva solapada' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Inventario prohibido para clientes.
  begin
    insert into public.inventory_items (name, unit) values ('X', 'u');
    raise exception 'FALLO cliente creó producto' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.admin_unschedulable_appointments();
    raise exception 'FALLO cliente consultó función de admin' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Garantía en base de datos contra solapamientos (concurrencia) ---------------
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  begin
    insert into public.appointments (client_id, starts_at, ends_at)
    values (u_b, (v_day + time '09:15') at time zone tz, (v_day + time '09:45') at time zone tz);
    raise exception 'FALLO restricción de solapamiento' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when exclusion_violation then null;
  end;
  v_passed := v_passed + 1;

  -- Cancelación según antelación -------------------------------------------------
  update public.business_settings set cancellation_min_hours = 720;
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.cancel_appointment(v_appt2.id);
    raise exception 'FALLO cancelación fuera de plazo' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  perform set_config('role', 'postgres', true);
  update public.business_settings set cancellation_min_hours = 0;
  perform set_config('role', 'authenticated', true);
  v_appt2 := public.cancel_appointment(v_appt2.id);
  if v_appt2.status <> 'cancelled' or v_appt2.cancelled_by <> u_a then
    raise exception 'FALLO cancelación válida';
  end if;
  begin
    perform public.cancel_appointment(v_appt2.id);
    raise exception 'FALLO doble cancelación' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Administrador -----------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.profiles where id in (u_a, u_b, u_admin);
  if v_count <> 3 then raise exception 'FALLO admin no ve perfiles'; end if;

  insert into public.blocked_slots (starts_at, ends_at, reason)
  values ((v_day + time '10:00') at time zone tz, (v_day + time '11:00') at time zone tz, 'Prueba');
  if (select created_by from public.blocked_slots limit 1) <> u_admin then
    raise exception 'FALLO created_by del bloqueo';
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  begin
    perform public.book_appointment((v_day + time '10:30') at time zone tz);
    raise exception 'FALLO reserva durante bloqueo' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  insert into public.blocked_slots (starts_at, ends_at, reason)
  values ((v_day + time '08:45') at time zone tz, (v_day + time '09:15') at time zone tz, 'Afecta cita');
  select count(*) into v_count from public.admin_unschedulable_appointments()
  where appointment_id = v_appt.id and reason = 'blocked';
  if v_count <> 1 then raise exception 'FALLO aviso de cita afectada por bloqueo'; end if;
  delete from public.blocked_slots where reason = 'Afecta cita';
  update public.working_hours set start_time = '09:30' where weekday = v_dow and start_time = '09:00';
  select count(*) into v_count from public.admin_unschedulable_appointments()
  where appointment_id = v_appt.id and reason = 'outside_hours';
  if v_count <> 1 then raise exception 'FALLO aviso de cita fuera de horario'; end if;
  update public.working_hours set start_time = '09:00' where weekday = v_dow and start_time = '09:30';
  v_passed := v_passed + 1;

  v_appt := public.set_appointment_status(v_appt.id, 'confirmed');
  if v_appt.status <> 'confirmed' then raise exception 'FALLO confirmar'; end if;
  begin
    perform public.set_appointment_status(v_appt.id, 'completed');
    raise exception 'FALLO completar cita futura' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.set_appointment_status(v_appt.id, 'pending');
    raise exception 'FALLO volver a pendiente' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  perform set_config('role', 'postgres', true);
  insert into public.appointments (client_id, starts_at, ends_at, status)
  values (u_b, now() - interval '2 hours', now() - interval '90 minutes', 'confirmed')
  returning * into v_appt2;
  perform set_config('role', 'authenticated', true);
  v_appt2 := public.set_appointment_status(v_appt2.id, 'completed');
  begin
    perform public.set_appointment_status(v_appt2.id, 'cancelled');
    raise exception 'FALLO cancelar cita completada' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Inventario --------------------------------------------------------------
  insert into public.inventory_items (name, unit, min_quantity)
  values ('Cera mate', 'unidad', 5) returning id into v_item;
  begin
    update public.inventory_items set quantity = 100 where id = v_item;
    raise exception 'FALLO cantidad modificada directamente' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    insert into public.inventory_items (name, unit) values ('  cera MATE ', 'u');
    raise exception 'FALLO nombre duplicado' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    insert into public.inventory_movements (item_id, type, quantity_delta, quantity_after)
    values (v_item, 'entry', 1, 1);
    raise exception 'FALLO movimiento insertado directamente' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  v_mov := public.register_inventory_movement(v_item, 'entry', 10);
  if v_mov.quantity_after <> 10 or v_mov.performed_by <> u_admin then raise exception 'FALLO entrada'; end if;
  begin
    perform public.register_inventory_movement(v_item, 'exit', 15);
    raise exception 'FALLO salida mayor que existencias' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.register_inventory_movement(v_item, 'entry', -3);
    raise exception 'FALLO cantidad negativa' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_mov := public.register_inventory_movement(v_item, 'exit', 4);
  begin
    perform public.register_inventory_movement(v_item, 'adjustment', 3);
    raise exception 'FALLO ajuste sin motivo' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_mov := public.register_inventory_movement(v_item, 'adjustment', 3, 'Conteo físico');
  select quantity into v_qty from public.inventory_items where id = v_item;
  if v_qty <> 3 or v_mov.quantity_delta <> -3 then raise exception 'FALLO ajuste (%)', v_qty; end if;
  if not exists (select 1 from public.inventory_low_stock where id = v_item) then
    raise exception 'FALLO alerta de existencias bajas';
  end if;
  v_passed := v_passed + 1;

  update public.inventory_items set is_active = false where id = v_item;
  begin
    perform public.register_inventory_movement(v_item, 'entry', 1);
    raise exception 'FALLO movimiento en producto desactivado' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  select count(*) into v_count from public.inventory_movements where item_id = v_item;
  if v_count <> 3 then raise exception 'FALLO historial de producto desactivado'; end if;

  perform set_config('role', 'postgres', true);
  begin
    update public.inventory_movements set quantity_delta = 99 where item_id = v_item;
    raise exception 'FALLO historial modificable' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Alta de producto con existencia inicial (atómica) ------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select id, quantity into v_item, v_qty from public.create_inventory_item('Shampoo QA', 'botella', 2, 5);
  select count(*) into v_count from public.inventory_movements where item_id = v_item and reason = 'Existencia inicial';
  if v_qty <> 5 or v_count <> 1 then raise exception 'FALLO alta con existencia inicial'; end if;
  begin
    perform public.create_inventory_item('shampoo qa', 'u', 0, 0);
    raise exception 'FALLO producto duplicado' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.create_inventory_item('Otro QA', 'u', 0, -1);
    raise exception 'FALLO existencia inicial negativa' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Cliente sin acceso a inventario ni a funciones de admin ---------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into v_count from public.inventory_items;
  if v_count <> 0 then raise exception 'FALLO cliente ve inventario'; end if;
  begin
    perform public.register_inventory_movement(v_item, 'entry', 1);
    raise exception 'FALLO cliente registró movimiento' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.create_inventory_item('Cliente QA', 'u', 0, 0);
    raise exception 'FALLO cliente creó producto por función' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  v_passed := v_passed + 1;

  -- Anónimo -----------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
  begin
    perform 1 from public.appointments;
    raise exception 'FALLO anónimo lee citas' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform 1 from public.profiles;
    raise exception 'FALLO anónimo lee perfiles' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  begin
    perform public.book_appointment((v_day + time '15:00') at time zone tz);
    raise exception 'FALLO anónimo reserva' using errcode = 'T0001';
  exception when sqlstate 'T0001' then raise; when others then null;
  end;
  select count(*) into v_count from public.working_hours;
  if v_count < 2 then raise exception 'FALLO anónimo no ve horarios públicos'; end if;
  v_passed := v_passed + 1;

  raise exception 'CHECKS_PASSED: %', v_passed using errcode = 'T0000';
end;
$checks$;
