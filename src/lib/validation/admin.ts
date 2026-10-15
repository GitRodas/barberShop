import { z } from "zod";
import { isYmd } from "@/lib/time";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida");
const ymd = z.string().refine(isYmd, "Fecha inválida");
const confirm = z
  .union([z.literal("1"), z.null(), z.undefined()])
  .transform((value) => value === "1");

export const appointmentStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["confirmed", "completed", "cancelled"]),
});

export const workingHoursSchema = z
  .object({
    weekday: z.coerce.number().int().min(1).max(7),
    startTime: time,
    endTime: time,
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "La hora final debe ser posterior a la inicial",
    path: ["endTime"],
  });

export const workingHoursChangeSchema = z.object({
  id: z.uuid(),
  operation: z.enum(["activate", "deactivate", "delete"]),
  confirm,
});

export const blockedSlotSchema = z
  .object({
    startDate: ymd,
    endDate: ymd,
    allDay: z.boolean(),
    startTime: time.optional(),
    endTime: time.optional(),
    reason: z
      .string()
      .trim()
      .max(200, "Máximo 200 caracteres")
      .transform((value) => value || null),
    confirm,
  })
  .refine((data) => data.allDay || (data.startTime && data.endTime), {
    message: "Indica la hora de inicio y fin",
    path: ["endTime"],
  });

export const settingsSchema = z.object({
  slotMinutes: z.coerce.number().int().min(10).max(240),
  minAdvanceMinutes: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .max(10080, "Máximo 7 días (10080 minutos)"),
  bookingHorizonDays: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 día")
    .max(365, "Máximo 365 días"),
  cancellationMinHours: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .max(720, "Máximo 720 horas"),
  maxActiveAppointmentsPerClient: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1")
    .max(20, "Máximo 20"),
});
