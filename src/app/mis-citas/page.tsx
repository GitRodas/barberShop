import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, StickyNote } from "lucide-react";
import { CancelAppointmentButton } from "@/components/booking/cancel-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PanelSkeleton } from "@/components/admin/panel-skeleton";
import { StatusBadge } from "@/components/appointments/status-badge";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { getBookingRules, getMyAppointments, type MyAppointment } from "@/lib/data/booking";
import { formatDate, formatTime } from "@/lib/time";

export const metadata: Metadata = { title: "Mis citas" };

export default function MyAppointmentsPage({ searchParams }: PageProps<"/mis-citas">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Mis citas" />
        <ButtonLink href="/reservar">Nueva reserva</ButtonLink>
      </div>
      <div className="mt-8">
        <Suspense fallback={<PanelSkeleton />}>
          <Appointments searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

function AppointmentItem({
  appointment,
  cancellable,
  cancelHint,
}: {
  appointment: MyAppointment;
  cancellable?: boolean;
  cancelHint?: string;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="font-medium first-letter:uppercase">{formatDate(appointment.starts_at)}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted tabular-nums">
          <Clock className="size-3.5" aria-hidden />
          {formatTime(appointment.starts_at)} – {formatTime(appointment.ends_at)}
          <span className="ml-1">
            <StatusBadge status={appointment.status} />
          </span>
        </p>
        {appointment.notes && (
          <p className="flex gap-1 text-sm text-muted">
            <StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="break-words">{appointment.notes}</span>
          </p>
        )}
      </div>
      {cancellable && <CancelAppointmentButton id={appointment.id} />}
      {cancelHint && <p className="text-xs text-muted sm:max-w-48 sm:text-right">{cancelHint}</p>}
    </li>
  );
}

async function Appointments({ searchParams }: Pick<PageProps<"/mis-citas">, "searchParams">) {
  const [appointments, rules, { reservada }] = await Promise.all([
    getMyAppointments(),
    getBookingRules(),
    searchParams,
  ]);
  const now = new Date().getTime(); // componente de servidor: se evalúa una vez por petición
  const limitMs = rules.cancellation_min_hours * 3_600_000;

  const isUpcoming = (a: MyAppointment) =>
    (a.status === "pending" || a.status === "confirmed") && new Date(a.ends_at).getTime() > now;
  const upcoming = appointments.filter(isUpcoming).reverse();
  const history = appointments.filter((a) => !isUpcoming(a));

  return (
    <div className="space-y-10">
      {reservada === "1" && (
        <Alert variant="success">
          ¡Reserva creada! Tu cita está pendiente de confirmación por el barbero.
        </Alert>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Próximas</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="No tienes citas próximas">
            <ButtonLink href="/reservar" className="mt-3">
              Reservar ahora
            </ButtonLink>
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((appointment) => {
              const cancellable = new Date(appointment.starts_at).getTime() - now >= limitMs;
              return (
                <AppointmentItem
                  key={appointment.id}
                  appointment={appointment}
                  cancellable={cancellable}
                  cancelHint={
                    cancellable
                      ? undefined
                      : `Ya no se puede cancelar en línea (menos de ${rules.cancellation_min_hours} h). Contacta al barbero.`
                  }
                />
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Historial</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Aún no tienes citas anteriores.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((appointment) => (
              <AppointmentItem key={appointment.id} appointment={appointment} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
