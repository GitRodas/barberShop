-- BarberShop: esquema base (tablas, tipos, restricciones e índices).

create extension if not exists btree_gist with schema extensions;

create schema if not exists private;

-- Tipos -----------------------------------------------------------------------

create type public.user_role as enum ('client', 'admin');

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'completed'
);

create type public.inventory_movement_type as enum ('entry', 'exit', 'adjustment');

-- Rango de horas del día para impedir intervalos laborales solapados.
create type public.timerange as range (subtype = time);

-- Utilidades ------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Configuración del negocio (fila única) --------------------------------------

create table public.business_settings (
  id boolean primary key default true check (id),
  timezone text not null default 'America/Bogota',
  slot_minutes integer not null default 30 check (slot_minutes between 10 and 240),
  min_advance_minutes integer not null default 60 check (min_advance_minutes between 0 and 10080),
  booking_horizon_days integer not null default 30 check (booking_horizon_days between 1 and 365),
  cancellation_min_hours integer not null default 2 check (cancellation_min_hours between 0 and 720),
  max_active_appointments_per_client integer not null default 2
    check (max_active_appointments_per_client between 1 and 20),
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id) values (true);

create trigger business_settings_set_updated_at
before update on public.business_settings
for each row execute function private.set_updated_at();

-- Perfiles --------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  phone text check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  role public.user_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Barbería unipersonal: como máximo un administrador.
create unique index profiles_single_admin on public.profiles ((true)) where role = 'admin';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

-- Horarios laborales (varios intervalos por día; los huecos son descansos) -------

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1 = lunes, 7 = domingo
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint working_hours_valid_range check (start_time < end_time),
  constraint working_hours_no_overlap exclude using gist (
    weekday with =,
    public.timerange(start_time, end_time, '[)') with &&
  ) where (is_active)
);

create index working_hours_weekday_idx on public.working_hours (weekday) where is_active;

create trigger working_hours_set_updated_at
before update on public.working_hours
for each row execute function private.set_updated_at();

-- Bloqueos --------------------------------------------------------------------

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text check (char_length(reason) <= 200),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint blocked_slots_valid_range check (starts_at < ends_at)
);

create index blocked_slots_range_idx on public.blocked_slots
  using gist (tstzrange(starts_at, ends_at, '[)'));

-- Citas -----------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  notes text check (char_length(notes) <= 500),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_valid_range check (starts_at < ends_at),
  constraint appointments_cancel_consistency check (
    (status = 'cancelled') = (cancelled_at is not null)
  ),
  -- Garantía final contra solapamientos, incluso con reservas concurrentes.
  constraint appointments_no_overlap exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

create index appointments_client_starts_idx on public.appointments (client_id, starts_at desc);
create index appointments_starts_idx on public.appointments (starts_at);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function private.set_updated_at();

-- Inventario ------------------------------------------------------------------

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  unit text not null check (char_length(btrim(unit)) between 1 and 30),
  quantity numeric(12, 2) not null default 0 check (quantity >= 0),
  min_quantity numeric(12, 2) not null default 0 check (min_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index inventory_items_name_unique on public.inventory_items (lower(btrim(name)));

create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row execute function private.set_updated_at();

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.inventory_items (id) on delete restrict,
  type public.inventory_movement_type not null,
  quantity_delta numeric(12, 2) not null check (quantity_delta <> 0),
  quantity_after numeric(12, 2) not null check (quantity_after >= 0),
  reason text check (char_length(reason) <= 300),
  performed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_sign check (
    (type = 'entry' and quantity_delta > 0)
    or (type = 'exit' and quantity_delta < 0)
    or (type = 'adjustment' and reason is not null and char_length(btrim(reason)) > 0)
  )
);

create index inventory_movements_item_idx on public.inventory_movements (item_id, created_at desc);
create index inventory_movements_created_idx on public.inventory_movements (created_at desc);

-- El historial es inmutable.
create function private.prevent_movement_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'El historial de inventario no se puede modificar';
end;
$$;

create trigger inventory_movements_immutable
before update or delete on public.inventory_movements
for each row execute function private.prevent_movement_changes();

-- Existencias bajas (respeta RLS de la tabla base).
create view public.inventory_low_stock
with (security_invoker = true) as
select id, name, unit, quantity, min_quantity
from public.inventory_items
where is_active and quantity <= min_quantity;
