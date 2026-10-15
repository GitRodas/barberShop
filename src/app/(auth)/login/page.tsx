import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard, FormSkeleton } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Ingresar" };

const notices: Record<string, string> = {
  enlace: "El enlace no es válido o expiró. Solicita uno nuevo.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="Ingresar"
      description="Accede para reservar y gestionar tus citas."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-accent hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormWithParams({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const { next, error } = await searchParams;
  return (
    <LoginForm
      next={safeRedirectPath(next, "/")}
      notice={typeof error === "string" ? notices[error] : undefined}
    />
  );
}
