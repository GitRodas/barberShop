import { TriangleAlert } from "lucide-react";
import type { AffectedAppointment } from "@/lib/forms";
import { formatDateTime } from "@/lib/time";

export function AffectedList({
  message,
  affected,
  children,
}: {
  message?: string;
  affected: AffectedAppointment[];
  children?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
    >
      <p className="flex gap-2 font-medium text-amber-800 dark:text-amber-200">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        {message}
      </p>
      <ul className="space-y-1 pl-6 text-foreground">
        {affected.map((appointment) => (
          <li key={appointment.id}>
            {formatDateTime(appointment.startsAt)} · {appointment.clientName}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
