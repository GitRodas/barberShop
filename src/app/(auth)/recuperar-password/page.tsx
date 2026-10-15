import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Te enviaremos un enlace para crear una nueva contraseña."
      footer={
        <Link href="/login" className="font-medium text-accent hover:underline">
          Volver a ingresar
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
