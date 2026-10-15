import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { PanelSkeleton } from "@/components/admin/panel-skeleton";
import { requireAdmin } from "@/lib/auth/session";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Suspense fallback={<PanelSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}

// Cada página y acción vuelve a verificar el rol; RLS protege los datos.
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminNav />
      <div className="mt-8">{children}</div>
    </>
  );
}
