import Link from "next/link";
import { CalendarX2, Phone, StickyNote } from "lucide-react";
import type { AgendaAppointment } from "@/lib/data/admin";
import { StatusBadge } from "@/components/appointments/status-badge";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import {
  WEEKDAYS,
  addDays,
  daysInMonth,
  formatDate,
  formatTime,
  isoWeekday,
  startOfMonth,
  toYmd,
  type Ymd,
} from "@/lib/time";

const isActive = (a: AgendaAppointment) => a.status === "pending" || a.status === "confirmed";

function groupByDay(appointments: AgendaAppointment[]) {
  const map = new Map<Ymd, AgendaAppointment[]>();
  for (const appointment of appointments) {
    const day = toYmd(appointment.starts_at);
    map.set(day, [...(map.get(day) ?? []), appointment]);
  }
  return map;
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <CalendarX2 className="size-7 text-muted" aria-hidden />
      <p className="font-medium">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  );
}

export function AppointmentCard({
  appointment,
  now,
}: {
  appointment: AgendaAppointment;
  now: Date;
}) {
  const muted = !isActive(appointment);
  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between ${
        muted ? "opacity-70" : ""
      }`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold tabular-nums">
            {formatTime(appointment.starts_at)} – {formatTime(appointment.ends_at)}
          </span>
          <StatusBadge status={appointment.status} />
        </div>
        <p className="truncate">{appointment.client?.full_name || "Cliente sin nombre"}</p>
        {appointment.client?.phone && (
          <a
            href={`tel:${appointment.client.phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <Phone className="size-3.5" aria-hidden />
            {appointment.client.phone}
          </a>
        )}
        {appointment.notes && (
          <p className="flex gap-1 text-sm text-muted">
            <StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="break-words">{appointment.notes}</span>
          </p>
        )}
      </div>
      <AppointmentActions
        id={appointment.id}
        status={appointment.status}
        started={new Date(appointment.starts_at) <= now}
      />
    </li>
  );
}

export function DayAgenda({
  appointments,
  now,
}: {
  appointments: AgendaAppointment[];
  now: Date;
}) {
  if (appointments.length === 0) {
    return <EmptyState title="No hay citas este día" />;
  }
  return (
    <ul className="space-y-3">
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} now={now} />
      ))}
    </ul>
  );
}

const chipStyles = {
  pending: "border-l-amber-500",
  confirmed: "border-l-sky-500",
  completed: "border-l-success",
  cancelled: "border-l-border line-through opacity-60",
} as const;

export function WeekAgenda({
  start,
  today,
  appointments,
}: {
  start: Ymd;
  today: Ymd;
  appointments: AgendaAppointment[];
}) {
  const byDay = groupByDay(appointments);
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {WEEKDAYS.map((weekday, index) => {
        const day = addDays(start, index);
        const items = byDay.get(day) ?? [];
        return (
          <section
            key={day}
            aria-label={formatDate(day)}
            className={`min-w-0 rounded-xl border bg-surface p-3 ${
              day === today ? "border-accent" : "border-border"
            }`}
          >
            <Link
              href={`/admin/citas?view=day&date=${day}`}
              className="flex items-baseline justify-between gap-2 text-sm hover:text-accent md:flex-col md:items-start md:gap-0"
            >
              <span className="font-medium">{weekday.short}</span>
              <span className="text-muted">{formatDate(day, { day: "numeric", month: "short" })}</span>
            </Link>
            {items.length === 0 ? (
              <p className="mt-2 text-xs text-muted">Sin citas</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {items.map((appointment) => (
                  <li key={appointment.id}>
                    <Link
                      href={`/admin/citas?view=day&date=${day}`}
                      className={`block rounded-md border border-l-4 border-border px-2 py-1 text-xs hover:bg-background ${chipStyles[appointment.status]}`}
                    >
                      <span className="block font-medium tabular-nums">
                        {formatTime(appointment.starts_at)}
                      </span>
                      <span className="block truncate text-muted">
                        {appointment.client?.full_name || "Cliente"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function MonthAgenda({
  month,
  today,
  appointments,
}: {
  month: Ymd;
  today: Ymd;
  appointments: AgendaAppointment[];
}) {
  const first = startOfMonth(month);
  const leading = isoWeekday(first) - 1;
  const total = daysInMonth(first);
  const byDay = groupByDay(appointments.filter(isActive));
  const cells: (Ymd | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, i) => addDays(first, i)),
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-2 sm:p-3">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday.value} className="py-1">
            <abbr title={weekday.label} className="no-underline">
              {weekday.short}
            </abbr>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) =>
          day === null ? (
            <div key={`empty-${index}`} />
          ) : (
            <Link
              key={day}
              href={`/admin/citas?view=day&date=${day}`}
              aria-label={`${formatDate(day)}: ${byDay.get(day)?.length ?? 0} citas activas`}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors hover:border-accent sm:aspect-auto sm:h-20 ${
                day === today ? "border-accent font-semibold" : "border-transparent"
              } ${day < today ? "text-muted" : ""}`}
            >
              <span>{Number(day.slice(8))}</span>
              {(byDay.get(day)?.length ?? 0) > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-[0.65rem] font-medium leading-4 text-accent-foreground">
                  {byDay.get(day)!.length}
                </span>
              )}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
