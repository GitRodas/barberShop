"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";
import { formValues, validationError, type FormState } from "@/lib/forms";
import {
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

async function siteUrl(): Promise<string> {
  const configured = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const origin = (await headers()).get("origin");
  return origin ?? "http://localhost:3000";
}

function confirmUrl(base: string, next: string) {
  return `${base}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["email", "next"]);
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return validationError(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: authErrorMessage(error), values };
  }

  redirect(safeRedirectPath(values.next, "/"));
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["fullName", "phone", "email"]);
  const parsed = registerSchema.safeParse({
    ...values,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return validationError(parsed.error, values);

  const { email, password, fullName, phone } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl(await siteUrl(), "/reservar"),
      // El rol nunca se envía: el trigger de la base de datos siempre asigna 'client'.
      data: { full_name: fullName, phone },
    },
  });
  if (error) {
    return { status: "error", message: authErrorMessage(error), values };
  }

  // Mismo mensaje si el correo ya existía, para no revelar cuentas registradas.
  return {
    status: "success",
    message: `Te enviamos un enlace de confirmación a ${email}. Ábrelo para activar tu cuenta.`,
  };
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: confirmUrl(await siteUrl(), "/restablecer-password") },
  );
  if (error?.code?.startsWith("over_")) {
    return { status: "error", message: authErrorMessage(error), values };
  }

  return {
    status: "success",
    message:
      "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
  };
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) {
    return {
      status: "error",
      message: "Tu enlace expiró. Solicita uno nuevo para restablecer la contraseña.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { status: "error", message: authErrorMessage(error) };

  return { status: "success", message: "Tu contraseña se actualizó correctamente." };
}

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["fullName", "phone"]);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/perfil");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.id);
  if (error) {
    return { status: "error", message: "No pudimos guardar tu perfil.", values };
  }

  refresh();
  return { status: "success", message: "Perfil actualizado.", values };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
