import type { Metadata } from "next";
import { Suspense } from "react";
import { ComingSoon } from "@/components/ui/coming-soon";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reservar" };

export default function BookPage() {
  return (
    <Suspense>
      <Guard />
    </Suspense>
  );
}

async function Guard() {
  await requireUser("/reservar");
  return <ComingSoon title="Reservar cita" />;
}
