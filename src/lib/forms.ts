import type { z } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";

export type AffectedAppointment = {
  id: string;
  startsAt: string;
  clientName: string;
};

export type FormState = {
  status: "idle" | "success" | "error" | "confirm";
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  // Valores enviados (sin contraseñas) para conservarlos tras un error.
  values?: Record<string, string>;
  // Citas afectadas por un cambio que requiere confirmación.
  affected?: AffectedAppointment[];
};

export const initialFormState: FormState = { status: "idle" };

export function formValues(
  formData: FormData,
  keys: readonly string[],
): Record<string, string> {
  return Object.fromEntries(
    keys.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === "string" ? value : ""];
    }),
  );
}

export function validationError(
  error: z.ZodError,
  values?: Record<string, string>,
): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return {
    status: "error",
    message: "Revisa los campos marcados.",
    fieldErrors,
    values,
  };
}

// Mensajes propios de las funciones de la base de datos (raise exception) se muestran tal cual.
const ownMessageCodes = new Set(["P0001", "P0002", "22023", "22001", "28000"]);

export function dbErrorMessage(
  error: PostgrestError,
  fallback = "No pudimos completar la operación. Inténtalo de nuevo.",
): string {
  if (error.code === "23P01") return "Se solapa con otro registro existente.";
  if (error.code === "23505") return "Ya existe un registro con esos datos.";
  if (error.code === "42501") return "No tienes permiso para esta acción.";
  if (ownMessageCodes.has(error.code) && error.message) return error.message;
  return fallback;
}
