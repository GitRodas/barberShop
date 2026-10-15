"use client";

import { useActionState } from "react";
import { signUp } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initialFormState);

  if (state.status === "success") {
    return <Alert variant="success">{state.message}</Alert>;
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="error">{state.message}</Alert>
      )}
      <Field
        label="Nombre completo"
        name="fullName"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName}
        errors={state.fieldErrors?.fullName}
      />
      <Field
        label="Teléfono (opcional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={state.values?.phone}
        errors={state.fieldErrors?.phone}
      />
      <Field
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Contraseña"
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
        Crear cuenta
      </Button>
    </form>
  );
}
