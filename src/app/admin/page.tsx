import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock, Hourglass, PackageX } from "lucide-react";
import { DayAgenda } from "@/components/admin/agenda";
import { PanelSkeleton } from "@/components/admin/panel-skeleton";
import { UnschedulablePanel } from "@/components/admin/unschedulable-panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/session";
import {
  getAppointmentsInRange,
  getLowStock,
  getPendingCount,
} from "@/lib/data/admin";
import { addDays, formatDate, localToDate, todayYmd } from "@/lib/time";

export const metadata: Metadata = { title: "Panel" };

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const admin = await requireAdmin();
  const today = todayYmd();
  const [todayAppointments, weekAppointments, pending, lowStock] = await Promise.all([
    getAppointmentsInRange(localToDate(today), localToDate(addDays(today, 1))),
    getAppointmentsInRange(localToDate(today), localToDate(addDays(today, 7)), { activeOnly: true }),
    getPendingCount(),
    getLowStock(),
  ]);
  const now = new Date();
  const firstName = admin.profile.full_name.split(" ")[0];

  const stats = [
    {
      label: "Citas activas hoy",
      value: todayAppointments.filter((a) => a.status === "pending" || a.status === "confirmed").length,
      icon: CalendarClock,
      href: "/admin/citas?view=day",
    },
    {
      label: "Pendientes por confirmar",
      value: pending,
      icon: Hourglass,
      href: "/admin/citas?view=week",
    },
    {
      label: "Productos con existencias bajas",
      value: lowStock.length,
      icon: PackageX,
      href: "/admin/inventario",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Resumen"}
        description={`Hoy es ${formatDate(today)}. Próximos 7 días: ${weekAppointments.length} citas activas.`}
      />

      <Suspense>
        <UnschedulablePanel />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <Icon className="size-5 text-accent" aria-hidden />
            <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </Link>
        ))}
      </div>

      {lowStock.length > 0 && (
        <section className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
          <h2 className="font-medium text-danger">Existencias bajas</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {lowStock.map((item) => (
              <li key={item.id}>
                {item.name}: {item.quantity} {item.unit} (mínimo {item.min_quantity})
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Agenda de hoy</h2>
          <Link href="/admin/citas?view=week" className="text-sm text-accent hover:underline">
            Ver semana
          </Link>
        </div>
        <DayAgenda appointments={todayAppointments} now={now} />
      </section>
    </div>
  );
}
