import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/auth/auth-card";
import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { getSettings } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Configuración" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Configuración" description="Reglas de reserva y cancelación." />
      <div className="mt-6 max-w-3xl rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <Suspense fallback={<FormSkeleton fields={5} />}>
          <SettingsLoader />
        </Suspense>
      </div>
    </>
  );
}

async function SettingsLoader() {
  const settings = await getSettings();
  return (
    <SettingsForm
      settings={{
        slotMinutes: settings.slot_minutes,
        minAdvanceMinutes: settings.min_advance_minutes,
        bookingHorizonDays: settings.booking_horizon_days,
        cancellationMinHours: settings.cancellation_min_hours,
        maxActiveAppointmentsPerClient: settings.max_active_appointments_per_client,
      }}
    />
  );
}
