import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Info } from "lucide-react";
import { BookingForm } from "@/components/booking/booking-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PanelSkeleton } from "@/components/admin/panel-skeleton";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getAvailableSlots, getBookingRules, getOpenWeekdays } from "@/lib/data/booking";
import { WEEKDAYS, addDays, formatDate, isYmd, isoWeekday, todayYmd } from "@/lib/time";

export const metadata: Metadata = { title: "Reservar" };

export default function BookPage({ searchParams }: PageProps<"/reservar">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader title="Reservar cita" description="Elige el día y la hora de tu corte." />
      <div className="mt-8">
        <Suspense fallback={<PanelSkeleton />}>
          <Booking searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Booking({ searchParams }: Pick<PageProps<"/reservar">, "searchParams">) {
  const user = await requireUser("/reservar");
  if (user.profile.role === "admin") {
    return (
      <EmptyState title="Las reservas son para clientes">
        <ButtonLink href="/admin/citas" className="mt-3">
          Ir a la agenda
        </ButtonLink>
      </EmptyState>
    );
  }

  const [{ fecha }, rules, openWeekdays] = await Promise.all([
    searchParams,
    getBookingRules(),
    getOpenWeekdays(),
  ]);

  if (openWeekdays.size === 0) {
    return (
      <EmptyState title="Aún no hay horarios disponibles">
        Vuelve pronto: el barbero está configurando su agenda.
      </EmptyState>
    );
  }

  const today = todayYmd();
  const days = Array.from({ length: rules.booking_horizon_days }, (_, i) => addDays(today, i));
  const isOpen = (day: string) => openWeekdays.has(isoWeekday(day));
  const selected =
    isYmd(fecha) && days.includes(fecha) ? fecha : (days.find(isOpen) ?? today);
  const slots = isOpen(selected) ? await getAvailableSlots(selected) : [];

  return (
    <div className="space-y-8">
      {!user.profile.phone && (
        <p className="flex gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <span>
            Agrega tu teléfono en tu{" "}
            <Link href="/perfil" className="font-medium text-accent hover:underline">
              perfil
            </Link>{" "}
            para que el barbero pueda contactarte si hay algún cambio.
          </span>
        </p>
      )}

      <nav aria-label="Días" className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-2">
          {days.map((day) => {
            const open = isOpen(day);
            const active = day === selected;
            const weekday = WEEKDAYS[isoWeekday(day) - 1];
            return (
              <li key={day}>
                {open ? (
                  <Link
                    href={`/reservar?fecha=${day}`}
                    aria-current={active ? "date" : undefined}
                    scroll={false}
                    className={`flex w-16 flex-col items-center rounded-xl border px-2 py-2 text-sm transition-colors ${
                      active
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-surface hover:border-accent"
                    }`}
                  >
                    <span className="text-xs">{day === today ? "Hoy" : weekday.short}</span>
                    <span className="text-lg font-semibold tabular-nums">{Number(day.slice(8))}</span>
                    <span className="text-xs opacity-80">{formatDate(day, { month: "short" })}</span>
                  </Link>
                ) : (
                  <span
                    aria-disabled
                    title="Cerrado"
                    className="flex w-16 flex-col items-center rounded-xl border border-dashed border-border px-2 py-2 text-sm text-muted opacity-60"
                  >
                    <span className="text-xs">{weekday.short}</span>
                    <span className="text-lg tabular-nums">{Number(day.slice(8))}</span>
                    <span className="text-xs">Cerrado</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {slots.length === 0 ? (
        <EmptyState title="No quedan horarios libres este día">Prueba con otro día.</EmptyState>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <BookingForm key={selected} slots={slots} dateLabel={formatDate(selected)} />
        </div>
      )}

      <p className="text-sm text-muted">
        Cada corte dura {rules.slot_minutes === 60 ? "1 hora" : `${rules.slot_minutes} minutos`}. Tu
        cita queda pendiente hasta que el barbero la confirme. Puedes cancelarla hasta{" "}
        {rules.cancellation_min_hours} {rules.cancellation_min_hours === 1 ? "hora" : "horas"} antes.
      </p>
    </div>
  );
}
