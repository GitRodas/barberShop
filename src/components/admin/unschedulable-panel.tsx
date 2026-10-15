import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { getUnschedulableAppointments } from "@/lib/data/admin";
import { formatDateTime, toYmd } from "@/lib/time";

const reasons: Record<string, string> = {
  blocked: "dentro de un bloqueo",
  outside_hours: "fuera del horario laboral",
};

// Red de seguridad: citas activas que quedaron fuera del horario tras un cambio.
export async function UnschedulablePanel() {
  const items = await getUnschedulableAppointments();
  if (items.length === 0) return null;

  return (
    <section
      role="alert"
      className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <h2 className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200">
        <TriangleAlert className="size-4" aria-hidden />
        {items.length === 1
          ? "1 cita activa quedó fuera del horario disponible"
          : `${items.length} citas activas quedaron fuera del horario disponible`}
      </h2>
      <ul className="mt-2 space-y-1 pl-6">
        {items.map((item) => (
          <li key={item.appointment_id}>
            <Link
              href={`/admin/citas?view=day&date=${toYmd(item.starts_at)}`}
              className="underline-offset-2 hover:underline"
            >
              {formatDateTime(item.starts_at)}
            </Link>{" "}
            · {reasons[item.reason] ?? item.reason}
          </li>
        ))}
      </ul>
    </section>
  );
}
