import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, FormSkeleton } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Nueva contraseña" description="Elige una contraseña segura.">
      <Suspense fallback={<FormSkeleton />}>
        <ResetPasswordGate />
      </Suspense>
    </AuthCard>
  );
}

async function ResetPasswordGate() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-4">
        <Alert variant="error">
          El enlace no es válido o expiró. Solicita uno nuevo.
        </Alert>
        <ButtonLink href="/recuperar-password" className="w-full">
          Solicitar enlace
        </ButtonLink>
      </div>
    );
  }
  return <ResetPasswordForm />;
}
