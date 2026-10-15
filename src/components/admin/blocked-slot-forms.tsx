"use client";

import { useActionState, useState } from "react";
import { Ban, Trash2 } from "lucide-react";
import { addBlockedSlot, deleteBlockedSlot } from "@/lib/admin/actions";
import { initialFormState } from "@/lib/forms";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { AffectedList } from "@/components/admin/affected-list";

export function BlockedSlotForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addBlockedSlot, initialFormState);
  const [allDay, setAllDay] = useState(false);
  const values = state.status === "success" ? undefined : state.values;
  const isAllDay = allDay;

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "success" && <Alert variant="success">{state.message}</Alert>}
      {state.status === "error" && state.message && <Alert variant="error">{state.message}</Alert>}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="allDay"
          defaultChecked={isAllDay}
          onChange={(event) => setAllDay(event.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
        Día(s) completo(s)
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Fecha de inicio"
          name="startDate"
          type="date"
          min={today}
          required
          defaultValue={values?.startDate ?? today}
          errors={state.fieldErrors?.startDate}
        />
        {!isAllDay && (
          <Field
            label="Hora de inicio"
            name="startTime"
            type="time"
            required
            defaultValue={values?.startTime}
            errors={state.fieldErrors?.startTime}
          />
        )}
        <Field
          label="Fecha de fin"
          name="endDate"
          type="date"
          min={today}
          hint="Vacío = mismo día de inicio."
          defaultValue={values?.endDate}
          errors={state.fieldErrors?.endDate}
        />
        {!isAllDay && (
          <Field
            label="Hora de fin"
            name="endTime"
            type="time"
            required
            defaultValue={values?.endTime}
            errors={state.fieldErrors?.endTime}
          />
        )}
      </div>
      <Field
        label="Motivo (opcional)"
        name="reason"
        maxLength={200}
        placeholder="Vacaciones, cita médica…"
        defaultValue={values?.reason}
        errors={state.fieldErrors?.reason}
      />

      {state.status === "confirm" && state.affected ? (
        <AffectedList message={state.message} affected={state.affected}>
          <Button type="submit" name="confirm" value="1" variant="secondary" pending={pending} className="px-3 py-1.5">
            Crear bloqueo de todos modos
          </Button>
        </AffectedList>
      ) : (
        <Button type="submit" pending={pending}>
          <Ban className="size-4" aria-hidden />
          Bloquear periodo
        </Button>
      )}
    </form>
  );
}

export function DeleteBlockedSlotButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteBlockedSlot, initialFormState);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        pending={pending}
        className="px-2 py-1 hover:text-danger"
        aria-label="Eliminar bloqueo"
        title="Eliminar"
      >
        {!pending && <Trash2 className="size-4" aria-hidden />}
      </Button>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
