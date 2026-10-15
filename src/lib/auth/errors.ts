import type { AuthError } from "@supabase/supabase-js";

const messages: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed:
    "Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.",
  email_address_invalid: "Ese correo no es válido. Revisa que esté bien escrito.",
  email_address_not_authorized:
    "Por ahora no podemos enviar correos a esa dirección. Inténtalo más tarde o contacta a la barbería.",
  over_email_send_rate_limit:
    "Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.",
  over_request_rate_limit:
    "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  signup_disabled: "El registro de nuevas cuentas está deshabilitado por ahora.",
  weak_password: "La contraseña es demasiado débil.",
  same_password: "La nueva contraseña debe ser distinta a la actual.",
  session_not_found: "Tu sesión expiró. Solicita un nuevo enlace.",
};

export function authErrorMessage(error: AuthError): string {
  const message = error.code ? messages[error.code] : undefined;
  if (message) return message;
  // Se registra en los logs del servidor (Vercel) para poder diagnosticar; nunca datos del usuario.
  console.error("[auth] error no controlado", { name: error.name, code: error.code, status: error.status });
  return "No pudimos completar la operación. Inténtalo de nuevo.";
}
