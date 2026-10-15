"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialFormState,
  );

  if (state.status === "success") {
    return <Alert variant="success">{state.message}</Alert>;
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="error">{state.message}</Alert>
      )}
      <Field
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <Button type="submit" pending={pending} className="w-full">
        Enviar enlace
      </Button>
    </form>
  );
}
