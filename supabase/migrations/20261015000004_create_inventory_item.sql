-- Crea un producto y, si corresponde, su entrada inicial en una sola transacción.
create function public.create_inventory_item(
  p_name text,
  p_unit text,
  p_min_quantity numeric default 0,
  p_initial_quantity numeric default 0
)
returns public.inventory_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.inventory_items;
begin
  if not private.is_admin() then
    raise exception 'Permiso denegado' using errcode = '42501';
  end if;
  if p_initial_quantity is null or p_initial_quantity < 0 then
    raise exception 'La existencia inicial no puede ser negativa' using errcode = '22023';
  end if;

  begin
    insert into public.inventory_items (name, unit, min_quantity)
    values (btrim(p_name), btrim(p_unit), round(coalesce(p_min_quantity, 0), 2))
    returning * into v_item;
  exception
    when unique_violation then
      raise exception 'Ya existe un producto con ese nombre' using errcode = 'P0001';
    when check_violation then
      raise exception 'Datos del producto inválidos' using errcode = '22023';
  end;

  if round(p_initial_quantity, 2) > 0 then
    perform public.register_inventory_movement(v_item.id, 'entry', p_initial_quantity, 'Existencia inicial');
    select * into v_item from public.inventory_items where id = v_item.id;
  end if;

  return v_item;
end;
$$;

revoke all on function public.create_inventory_item(text, text, numeric, numeric) from public, anon;
grant execute on function public.create_inventory_item(text, text, numeric, numeric) to authenticated;
