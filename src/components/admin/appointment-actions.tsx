"use client";

import { useActionState, useState } from "react";
import { Check, CheckCheck, X } from "lucide-react";
import { updateAppointmentStatus } from "@/lib/admin/actions";
import { initialFormState } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import type { AppointmentStatus } from "@/components/appointments/status-badge";

type Props = {
  id: string;
  status: AppointmentStatus;
  started: boolean;
};

export function AppointmentActions({ id, status, started }: Props) {
  const [state, action, pending] = useActionState(updateAppointmentStatus, initialFormState);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (status === "cancelled" || status === "completed") return null;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {confirmingCancel ? (
        <>
          <span className="text-sm text-muted">¿Cancelar esta cita?</span>
          <Button
            type="submit"
            name="status"
            value="cancelled"
            variant="secondary"
            pending={pending}
            className="px-3 py-1.5 text-danger"
          >
            Sí, cancelar
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-1.5"
            onClick={() => setConfirmingCancel(false)}
          >
            No
          </Button>
        </>
      ) : (
        <>
          {status === "pending" && (
            <Button type="submit" name="status" value="confirmed" pending={pending} className="px-3 py-1.5">
              <Check className="size-4" aria-hidden />
              Confirmar
            </Button>
          )}
          {started && (
            <Button
              type="submit"
              name="status"
              value="completed"
              variant="secondary"
              pending={pending}
              className="px-3 py-1.5"
            >
              <CheckCheck className="size-4" aria-hidden />
              Completar
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            className="px-3 py-1.5"
            onClick={() => setConfirmingCancel(true)}
          >
            <X className="size-4" aria-hidden />
            Cancelar
          </Button>
        </>
      )}
      {state.status === "error" && (
        <p role="alert" className="w-full text-xs text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
