"use client";

import { useActionState, useState } from "react";
import { cancelMyAppointment } from "@/lib/booking/actions";
import { initialFormState } from "@/lib/forms";
import { Button } from "@/components/ui/button";

export function CancelAppointmentButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(cancelMyAppointment, initialFormState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {confirming ? (
        <>
          <span className="text-sm text-muted">¿Seguro que quieres cancelar?</span>
          <Button type="submit" variant="secondary" pending={pending} className="px-3 py-1.5 text-danger">
            Sí, cancelar
          </Button>
          <Button type="button" variant="ghost" className="px-3 py-1.5" onClick={() => setConfirming(false)}>
            No
          </Button>
        </>
      ) : (
        <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setConfirming(true)}>
          Cancelar cita
        </Button>
      )}
      {state.status === "error" && (
        <p role="alert" className="w-full text-xs text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
