import type { z } from "zod";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  // Valores enviados (sin contraseñas) para conservarlos tras un error.
  values?: Record<string, string>;
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
