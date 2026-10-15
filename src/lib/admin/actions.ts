"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  getFutureActiveAppointments,
  getWorkingHours,
  type AgendaAppointment,
} from "@/lib/data/admin";
import { appointmentsLosingCoverage, overlaps } from "@/lib/admin/schedule";
import { addDays, localToDate } from "@/lib/time";
import {
  dbErrorMessage,
  formValues,
  validationError,
  type AffectedAppointment,
  type FormState,
} from "@/lib/forms";
import {
  appointmentStatusSchema,
  blockedSlotSchema,
  settingsSchema,
  workingHoursChangeSchema,
  workingHoursSchema,
} from "@/lib/validation/admin";

function toAffected(appointments: AgendaAppointment[]): AffectedAppointment[] {
  return appointments.map((appointment) => ({
    id: appointment.id,
    startsAt: appointment.starts_at,
    clientName: appointment.client?.full_name || "Cliente",
  }));
}

function confirmState(affected: AgendaAppointment[], what: string): FormState {
  return {
    status: "confirm",
    message: `${what} afecta ${affected.length === 1 ? "1 cita activa" : `${affected.length} citas activas`}. Las citas no se cancelan automáticamente: revísalas o contacta a los clientes.`,
    affected: toAffected(affected),
  };
}

// Citas -----------------------------------------------------------------------

export async function updateAppointmentStatus(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = appointmentStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { status: "error", message: "Solicitud inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_appointment_status", {
    p_appointment_id: parsed.data.id,
    p_status: parsed.data.status,
  });
  if (error) return { status: "error", message: dbErrorMessage(error) };

  refresh();
  return { status: "success" };
}

// Horarios laborales ------------------------------------------------------------

export async function addWorkingHours(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, ["weekday", "startTime", "endTime"]);
  const parsed = workingHoursSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase.from("working_hours").insert({
    weekday: parsed.data.weekday,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  });
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23P01"
          ? "Ese intervalo se cruza con otro intervalo activo del mismo día."
          : dbErrorMessage(error),
      values,
    };
  }

  refresh();
  return { status: "success", message: "Intervalo agregado.", values: { weekday: values.weekday } };
}

export async function changeWorkingHours(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = workingHoursChangeSchema.safeParse({
    id: formData.get("id"),
    operation: formData.get("operation"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { status: "error", message: "Solicitud inválida." };
  const { id, operation, confirm } = parsed.data;

  if (operation !== "activate" && !confirm) {
    const [intervals, appointments] = await Promise.all([
      getWorkingHours(),
      getFutureActiveAppointments(),
    ]);
    const proposed = intervals.filter((interval) => interval.id !== id);
    const affected = appointmentsLosingCoverage(appointments, intervals, proposed);
    if (affected.length > 0) {
      return {
        ...confirmState(affected, operation === "delete" ? "Eliminar este intervalo" : "Desactivar este intervalo"),
        values: { operation },
      };
    }
  }

  const supabase = await createClient();
  const { error } =
    operation === "delete"
      ? await supabase.from("working_hours").delete().eq("id", id)
      : await supabase
          .from("working_hours")
          .update({ is_active: operation === "activate" })
          .eq("id", id);
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23P01"
          ? "No se puede activar: se cruza con otro intervalo activo del mismo día."
          : dbErrorMessage(error),
    };
  }

  refresh();
  return { status: "success" };
}

// Bloqueos --------------------------------------------------------------------

export async function addBlockedSlot(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, ["startDate", "endDate", "startTime", "endTime", "reason"]);
  const allDay = formData.get("allDay") === "on";
  const parsed = blockedSlotSchema.safeParse({
    ...values,
    endDate: values.endDate || values.startDate,
    startTime: values.startTime || undefined,
    endTime: values.endTime || undefined,
    allDay,
    confirm: formData.get("confirm"),
  });
  const keep = { ...values, allDay: allDay ? "on" : "" };
  if (!parsed.success) return validationError(parsed.error, keep);

  const data = parsed.data;
  const start = data.allDay ? localToDate(data.startDate) : localToDate(data.startDate, data.startTime);
  const end = data.allDay
    ? localToDate(addDays(data.endDate, 1))
    : localToDate(data.endDate, data.endTime);

  if (end <= start) {
    return {
      status: "error",
      message: "El final del bloqueo debe ser posterior al inicio.",
      fieldErrors: { endTime: ["Debe ser posterior al inicio"] },
      values: keep,
    };
  }
  if (end <= new Date()) {
    return { status: "error", message: "El bloqueo ya terminó.", values: keep };
  }

  if (!data.confirm) {
    const affected = (await getFutureActiveAppointments()).filter((appointment) =>
      overlaps(appointment, start, end),
    );
    if (affected.length > 0) {
      return { ...confirmState(affected, "Este bloqueo"), values: keep };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("blocked_slots").insert({
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    reason: data.reason,
  });
  if (error) return { status: "error", message: dbErrorMessage(error), values: keep };

  refresh();
  return { status: "success", message: "Bloqueo creado." };
}

export async function deleteBlockedSlot(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return { status: "error", message: "Solicitud inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
  if (error) return { status: "error", message: dbErrorMessage(error) };

  refresh();
  return { status: "success" };
}

// Configuración ---------------------------------------------------------------

export async function updateSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const keys = [
    "slotMinutes",
    "minAdvanceMinutes",
    "bookingHorizonDays",
    "cancellationMinHours",
    "maxActiveAppointmentsPerClient",
  ] as const;
  const values = formValues(formData, keys);
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase
    .from("business_settings")
    .update({
      slot_minutes: parsed.data.slotMinutes,
      min_advance_minutes: parsed.data.minAdvanceMinutes,
      booking_horizon_days: parsed.data.bookingHorizonDays,
      cancellation_min_hours: parsed.data.cancellationMinHours,
      max_active_appointments_per_client: parsed.data.maxActiveAppointmentsPerClient,
    })
    .eq("id", true);
  if (error) return { status: "error", message: dbErrorMessage(error), values };

  refresh();
  return { status: "success", message: "Configuración guardada.", values };
}
