"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Alert } from "@/components/ui/alert";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialFormState);

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <Alert variant="success">{state.message}</Alert>
        <ButtonLink href="/" className="w-full">
          Ir al inicio
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="error">{state.message}</Alert>
      )}
      <Field
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="Mínimo 8 caracteres, con letras y números."
        errors={state.fieldErrors?.password}
      />
      <Field
        label="Confirmar contraseña"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <Button type="submit" pending={pending} className="w-full">
        Guardar contraseña
      </Button>
    </form>
  );
}
