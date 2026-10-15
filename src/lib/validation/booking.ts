import { z } from "zod";

export const bookingSchema = z.object({
  startsAt: z.iso.datetime({ offset: true, message: "Selecciona un horario" }),
  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .transform((value) => value || null),
});

export const cancelSchema = z.object({ id: z.uuid() });
