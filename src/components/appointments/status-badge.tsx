import type { Enums } from "@/lib/supabase/database.types";

export type AppointmentStatus = Enums<"appointment_status">;

export const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const styles: Record<AppointmentStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  confirmed: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  completed: "border-success/30 bg-success/10 text-success",
  cancelled: "border-border bg-border/40 text-muted",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
