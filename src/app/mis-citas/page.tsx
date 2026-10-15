import type { Metadata } from "next";
import { Suspense } from "react";
import { ComingSoon } from "@/components/ui/coming-soon";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mis citas" };

export default function MyAppointmentsPage() {
  return (
    <Suspense>
      <Guard />
    </Suspense>
  );
}

async function Guard() {
  await requireUser("/mis-citas");
  return <ComingSoon title="Mis citas" />;
}
