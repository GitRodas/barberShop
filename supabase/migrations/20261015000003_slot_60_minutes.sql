-- Cada corte dura 1 hora.
alter table public.business_settings alter column slot_minutes set default 60;

update public.business_settings set slot_minutes = 60 where id;
