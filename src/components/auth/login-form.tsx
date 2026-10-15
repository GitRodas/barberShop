"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState(signIn, initialFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {notice && state.status === "idle" && <Alert variant="error">{notice}</Alert>}
      {state.status === "error" && state.message && (
        <Alert variant="error">{state.message}</Alert>
      )}
      <input type="hidden" name="next" value={next} />
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
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      <div className="text-right text-sm">
        <Link href="/recuperar-password" className="text-accent hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <Button type="submit" pending={pending} className="w-full">
        Ingresar
      </Button>
    </form>
  );
}
