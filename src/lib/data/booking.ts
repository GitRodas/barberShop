import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/database.types";

export type Slot = { starts_at: string; ends_at: string };
export type MyAppointment = Pick<
  Tables<"appointments">,
  "id" | "starts_at" | "ends_at" | "status" | "notes" | "cancelled_at"
>;

export type BookingRules = Pick<
  Tables<"business_settings">,
  "slot_minutes" | "booking_horizon_days" | "cancellation_min_hours" | "max_active_appointments_per_client" | "min_advance_minutes"
>;

export async function getBookingRules(): Promise<BookingRules> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select("slot_minutes, booking_horizon_days, cancellation_min_hours, max_active_appointments_per_client, min_advance_minutes")
    .single();
  if (error) throw new Error("No se pudo cargar la configuración");
  return data;
}

/** Días ISO (1-7) con al menos un intervalo laboral activo. */
export async function getOpenWeekdays(): Promise<Set<number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("working_hours")
    .select("weekday")
    .eq("is_active", true);
  if (error) throw new Error("No se pudieron cargar los horarios");
  return new Set(data.map((row) => row.weekday));
}

// La función de la base de datos solo devuelve horarios futuros realmente libres.
export async function getAvailableSlots(date: string): Promise<Slot[]> {
  await requireUser("/reservar");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", { p_date: date });
  if (error) throw new Error("No se pudo consultar la disponibilidad");
  return data;
}

export async function getMyAppointments(): Promise<MyAppointment[]> {
  const user = await requireUser("/mis-citas");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, notes, cancelled_at")
    .eq("client_id", user.id)
    .order("starts_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("No se pudieron cargar tus citas");
  return data;
}
