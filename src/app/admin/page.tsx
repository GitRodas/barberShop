import type { Metadata } from "next";
import { Suspense } from "react";
import { ComingSoon } from "@/components/ui/coming-soon";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Panel" };

export default function AdminPage() {
  return (
    <Suspense>
      <Guard />
    </Suspense>
  );
}

async function Guard() {
  const admin = await requireAdmin();
  return (
    <ComingSoon title="Panel del barbero">
      <p className="text-sm text-muted">Sesión de administrador: {admin.email}</p>
    </ComingSoon>
  );
}
