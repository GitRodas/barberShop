import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/auth/auth-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mi perfil" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <PageHeader title="Mi perfil" description="Actualiza tus datos de contacto." />
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <Suspense fallback={<FormSkeleton fields={3} />}>
          <ProfileContent />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-muted">
        ¿Quieres cambiar tu contraseña?{" "}
        <Link href="/restablecer-password" className="font-medium text-accent hover:underline">
          Cambiar contraseña
        </Link>
      </p>
    </div>
  );
}

async function ProfileContent() {
  const user = await requireUser("/perfil");
  return (
    <ProfileForm
      email={user.email}
      fullName={user.profile.full_name}
      phone={user.profile.phone}
    />
  );
}
