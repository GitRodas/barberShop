import type { Metadata } from "next";
import { Suspense } from "react";
import { PanelSkeleton } from "@/components/admin/panel-skeleton";
import { UnschedulablePanel } from "@/components/admin/unschedulable-panel";
import { AddIntervalForm, IntervalControls } from "@/components/admin/working-hours-forms";
import { BlockedSlotForm, DeleteBlockedSlotButton } from "@/components/admin/blocked-slot-forms";
import { PageHeader } from "@/components/ui/page-header";
import { getUpcomingBlocks, getWorkingHours } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { WEEKDAYS, formatClock, formatDateTime, todayYmd } from "@/lib/time";

export const metadata: Metadata = { title: "Horarios" };

export default function SchedulePage() {
  return (
    <>
      <PageHeader
        title="Horarios"
        description="Define tus intervalos de trabajo por día. El tiempo entre intervalos se toma como descanso."
      />
      <div className="mt-6">
        <Suspense fallback={<PanelSkeleton />}>
          <Schedule />
        </Suspense>
      </div>
    </>
  );
}

const card = "rounded-2xl border border-border bg-surface p-5";

async function Schedule() {
  await requireAdmin();
  const [intervals, blocks] = await Promise.all([getWorkingHours(), getUpcomingBlocks()]);
  const today = todayYmd();

  return (
    <div className="space-y-8">
      <Suspense>
        <UnschedulablePanel />
      </Suspense>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Horario semanal</h2>
        {intervals.length === 0 && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            Aún no hay horarios: los clientes no podrán reservar hasta que agregues al menos un intervalo.
          </p>
        )}
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {WEEKDAYS.map((weekday) => {
            const dayIntervals = intervals.filter((i) => i.weekday === weekday.value);
            return (
              <li key={weekday.value} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start">
                <span className="w-28 shrink-0 font-medium">{weekday.label}</span>
                {dayIntervals.length === 0 ? (
                  <span className="text-sm text-muted">Cerrado</span>
                ) : (
                  <ul className="flex-1 space-y-2">
                    {dayIntervals.map((interval) => (
                      <li key={interval.id} className="flex flex-wrap items-start justify-between gap-2">
                        <span
                          className={`text-sm tabular-nums ${interval.is_active ? "" : "text-muted line-through"}`}
                        >
                          {formatClock(interval.start_time)} – {formatClock(interval.end_time)}
                          {!interval.is_active && <span className="ml-2 no-underline">(inactivo)</span>}
                        </span>
                        <IntervalControls id={interval.id} isActive={interval.is_active} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <div className={card}>
          <h3 className="mb-4 font-medium">Agregar intervalo</h3>
          <AddIntervalForm />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Bloqueos</h2>
        <p className="text-sm text-muted">
          Periodos en los que no atenderás (vacaciones, diligencias, festivos).
        </p>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted">No hay bloqueos próximos.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {blocks.map((block) => (
              <li key={block.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {formatDateTime(block.starts_at)} → {formatDateTime(block.ends_at)}
                  </p>
                  {block.reason && <p className="break-words text-muted">{block.reason}</p>}
                </div>
                <DeleteBlockedSlotButton id={block.id} />
              </li>
            ))}
          </ul>
        )}
        <div className={card}>
          <h3 className="mb-4 font-medium">Nuevo bloqueo</h3>
          <BlockedSlotForm today={today} />
        </div>
      </section>
    </div>
  );
}
