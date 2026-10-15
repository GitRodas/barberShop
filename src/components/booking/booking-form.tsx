"use client";

import { useActionState } from "react";
import { CalendarCheck } from "lucide-react";
import { bookAppointment } from "@/lib/booking/actions";
import { initialFormState } from "@/lib/forms";
import { formatTime } from "@/lib/time";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Slot = { starts_at: string; ends_at: string };

export function BookingForm({ slots, dateLabel }: { slots: Slot[]; dateLabel: string }) {
  const [state, action, pending] = useActionState(bookAppointment, initialFormState);

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="error">{state.message}</Alert>
      )}
      <fieldset>
        <legend className="mb-3 text-sm font-medium first-letter:uppercase">
          Horarios disponibles · {dateLabel}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {slots.map((slot) => (
            <label key={slot.starts_at} className="cursor-pointer">
              <input
                type="radio"
                name="startsAt"
                value={slot.starts_at}
                required
                className="peer sr-only"
              />
              <span className="flex flex-col items-center rounded-xl border border-border bg-surface px-3 py-3 text-center transition-colors hover:border-accent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                <span className="font-semibold tabular-nums">{formatTime(slot.starts_at)}</span>
                <span className="text-xs opacity-80">hasta {formatTime(slot.ends_at)}</span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.startsAt && (
          <p className="mt-2 text-xs text-danger">{state.fieldErrors.startsAt[0]}</p>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium">
          Notas para el barbero (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={state.values?.notes}
          placeholder="Ej.: corte degradado, arreglo de barba…"
          className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent sm:text-sm"
        />
        {state.fieldErrors?.notes && (
          <p className="text-xs text-danger">{state.fieldErrors.notes[0]}</p>
        )}
      </div>

      <Button type="submit" pending={pending} className="w-full sm:w-auto">
        <CalendarCheck className="size-4" aria-hidden />
        Reservar cita
      </Button>
    </form>
  );
}
