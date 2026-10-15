import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Crear cuenta"
      description="Regístrate para reservar tu próximo corte."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Ingresa
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
