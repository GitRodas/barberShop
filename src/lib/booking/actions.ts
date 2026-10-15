"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { dbErrorMessage, formValues, validationError, type FormState } from "@/lib/forms";
import { bookingSchema, cancelSchema } from "@/lib/validation/booking";

// La reserva se valida de nuevo en la base de datos (horario, bloqueos, solapes y límites)
// y siempre se asocia al usuario autenticado; el cliente no envía su id ni el estado.
export async function bookAppointment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/reservar");
  if (user.profile.role === "admin") {
    return { status: "error", message: "Las reservas son para clientes." };
  }

  const values = formValues(formData, ["startsAt", "notes"]);
  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase.rpc("book_appointment", {
    p_starts_at: parsed.data.startsAt,
    p_notes: parsed.data.notes ?? undefined,
  });
  if (error) {
    refresh(); // la disponibilidad pudo cambiar: recarga los horarios
    return { status: "error", message: dbErrorMessage(error), values: { notes: values.notes } };
  }

  redirect("/mis-citas?reservada=1");
}

export async function cancelMyAppointment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser("/mis-citas");
  const parsed = cancelSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { status: "error", message: "Solicitud inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: parsed.data.id,
  });
  if (error) return { status: "error", message: dbErrorMessage(error) };

  refresh();
  return { status: "success", message: "Cita cancelada." };
}
