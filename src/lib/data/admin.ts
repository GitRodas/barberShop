import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/database.types";

export type AgendaAppointment = Pick<
  Tables<"appointments">,
  "id" | "starts_at" | "ends_at" | "status" | "notes"
> & {
  client: Pick<Tables<"profiles">, "full_name" | "phone"> | null;
};

export type WorkingInterval = Tables<"working_hours">;
export type BlockedSlot = Tables<"blocked_slots">;
export type BusinessSettings = Tables<"business_settings">;

const agendaColumns =
  "id, starts_at, ends_at, status, notes, client:profiles!appointments_client_id_fkey(full_name, phone)";

// Todas las consultas pasan por requireAdmin y además están limitadas por RLS.
async function adminClient() {
  await requireAdmin();
  return createClient();
}

export async function getAppointmentsInRange(
  from: Date,
  to: Date,
  { activeOnly = false } = {},
): Promise<AgendaAppointment[]> {
  const supabase = await adminClient();
  let query = supabase
    .from("appointments")
    .select(agendaColumns)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");
  if (activeOnly) query = query.in("status", ["pending", "confirmed"]);
  const { data, error } = await query;
  if (error) throw new Error("No se pudieron cargar las citas");
  return data;
}

export async function getFutureActiveAppointments(): Promise<AgendaAppointment[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(agendaColumns)
    .in("status", ["pending", "confirmed"])
    .gt("ends_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw new Error("No se pudieron cargar las citas");
  return data;
}

export async function getPendingCount(): Promise<number> {
  const supabase = await adminClient();
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .gt("ends_at", new Date().toISOString());
  if (error) throw new Error("No se pudieron contar las citas");
  return count ?? 0;
}

export async function getWorkingHours(): Promise<WorkingInterval[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("working_hours")
    .select("*")
    .order("weekday")
    .order("start_time");
  if (error) throw new Error("No se pudieron cargar los horarios");
  return data;
}

export async function getUpcomingBlocks(): Promise<BlockedSlot[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("blocked_slots")
    .select("*")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw new Error("No se pudieron cargar los bloqueos");
  return data;
}

export async function getSettings(): Promise<BusinessSettings> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .single();
  if (error) throw new Error("No se pudo cargar la configuración");
  return data;
}

export async function getUnschedulableAppointments() {
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("admin_unschedulable_appointments");
  if (error) throw new Error("No se pudieron revisar las citas afectadas");
  return data;
}

export async function getLowStock() {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("inventory_low_stock")
    .select("*")
    .order("name");
  if (error) throw new Error("No se pudo revisar el inventario");
  return data;
}
