import type { AuthError } from "@supabase/supabase-js";

const messages: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed:
    "Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.",
  over_email_send_rate_limit:
    "Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.",
  over_request_rate_limit:
    "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  weak_password: "La contraseña es demasiado débil.",
  same_password: "La nueva contraseña debe ser distinta a la actual.",
  session_not_found: "Tu sesión expiró. Solicita un nuevo enlace.",
};

export function authErrorMessage(error: AuthError): string {
  return (
    (error.code && messages[error.code]) ||
    "No pudimos completar la operación. Inténtalo de nuevo."
  );
}
