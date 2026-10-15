import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayAgenda, MonthAgenda, WeekAgenda } from "@/components/admin/agenda";
import { PanelSkeleton } from "@/components/admin/panel-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { getAppointmentsInRange } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import {
  addDays,
  addMonths,
  daysInMonth,
  formatDate,
  isYmd,
  localToDate,
  startOfMonth,
  startOfWeek,
  todayYmd,
  type Ymd,
} from "@/lib/time";

export const metadata: Metadata = { title: "Citas" };

type View = "day" | "week" | "month";
const views: { value: View; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

export default function AdminAppointmentsPage({ searchParams }: PageProps<"/admin/citas">) {
  return (
    <>
      <PageHeader title="Agenda" description="Consulta y gestiona las citas." />
      <div className="mt-6">
        <Suspense fallback={<PanelSkeleton />}>
          <Agenda searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function range(view: View, date: Ymd): { from: Ymd; to: Ymd; title: string; prev: Ymd; next: Ymd } {
  if (view === "day") {
    return {
      from: date,
      to: addDays(date, 1),
      title: formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      prev: addDays(date, -1),
      next: addDays(date, 1),
    };
  }
  if (view === "week") {
    const from = startOfWeek(date);
    const to = addDays(from, 7);
    return {
      from,
      to,
      title: `${formatDate(from, { day: "numeric", month: "short" })} – ${formatDate(addDays(to, -1), { day: "numeric", month: "short", year: "numeric" })}`,
      prev: addDays(from, -7),
      next: to,
    };
  }
  const from = startOfMonth(date);
  return {
    from,
    to: addDays(from, daysInMonth(from)),
    title: formatDate(from, { month: "long", year: "numeric" }),
    prev: addMonths(from, -1),
    next: addMonths(from, 1),
  };
}

async function Agenda({ searchParams }: Pick<PageProps<"/admin/citas">, "searchParams">) {
  await requireAdmin(); // establece la petición antes de usar la hora actual
  const params = await searchParams;
  const view: View = views.some((v) => v.value === params.view) ? (params.view as View) : "day";
  const today = todayYmd();
  const date = isYmd(params.date) ? params.date : today;
  const { from, to, title, prev, next } = range(view, date);

  const appointments = await getAppointmentsInRange(localToDate(from), localToDate(to));
  const now = new Date();
  const href = (v: View, d: Ymd) => `/admin/citas?view=${v}&date=${d}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={href(view, prev)}
            className="rounded-full border border-border p-2 hover:border-accent"
            aria-label="Anterior"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link
            href={href(view, next)}
            className="rounded-full border border-border p-2 hover:border-accent"
            aria-label="Siguiente"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
          <Link
            href={href(view, today)}
            className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-accent"
          >
            Hoy
          </Link>
          <h2 className="ml-1 font-display text-lg font-semibold first-letter:uppercase">{title}</h2>
        </div>
        <div role="group" aria-label="Vista" className="inline-flex rounded-full border border-border p-1">
          {views.map((v) => (
            <Link
              key={v.value}
              href={href(v.value, date)}
              aria-current={v.value === view ? "page" : undefined}
              className={`rounded-full px-3 py-1 text-sm ${
                v.value === view ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      {view === "day" && <DayAgenda appointments={appointments} now={now} />}
      {view === "week" && <WeekAgenda start={from} today={today} appointments={appointments} />}
      {view === "month" && <MonthAgenda month={from} today={today} appointments={appointments} />}
    </div>
  );
}
