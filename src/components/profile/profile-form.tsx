"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type ProfileFormProps = {
  email: string;
  fullName: string;
  phone: string | null;
};

export function ProfileForm({ email, fullName, phone }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfile, initialFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && (
        <Alert variant={state.status === "success" ? "success" : "error"}>
          {state.message}
        </Alert>
      )}
      <Field label="Correo electrónico" name="email" value={email} readOnly disabled />
      <Field
        label="Nombre completo"
        name="fullName"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName ?? fullName}
        errors={state.fieldErrors?.fullName}
      />
      <Field
        label="Teléfono (opcional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={state.values?.phone ?? phone ?? ""}
        errors={state.fieldErrors?.phone}
      />
      <Button type="submit" pending={pending}>
        Guardar cambios
      </Button>
    </form>
  );
}
