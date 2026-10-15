"use client";

import { useActionState } from "react";
import { Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { addWorkingHours, changeWorkingHours } from "@/lib/admin/actions";
import { initialFormState, type AffectedAppointment } from "@/lib/forms";
import { WEEKDAYS } from "@/lib/time";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { AffectedList } from "@/components/admin/affected-list";

const weekdayOptions = WEEKDAYS.map((d) => ({ value: d.value, label: d.label }));

export function AddIntervalForm() {
  const [state, action, pending] = useActionState(addWorkingHours, initialFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && (
        <Alert variant={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Día"
          name="weekday"
          options={weekdayOptions}
          defaultValue={state.values?.weekday ?? "1"}
          key={`weekday-${state.values?.weekday}`}
          errors={state.fieldErrors?.weekday}
        />
        <Field
          label="Desde"
          name="startTime"
          type="time"
          required
          defaultValue={state.status === "error" ? state.values?.startTime : undefined}
          errors={state.fieldErrors?.startTime}
        />
        <Field
          label="Hasta"
          name="endTime"
          type="time"
          required
          defaultValue={state.status === "error" ? state.values?.endTime : undefined}
          errors={state.fieldErrors?.endTime}
        />
      </div>
      <Button type="submit" pending={pending}>
        <Plus className="size-4" aria-hidden />
        Agregar intervalo
      </Button>
    </form>
  );
}

export function IntervalControls({ id, isActive }: { id: string; isActive: boolean }) {
  const [state, action, pending] = useActionState(changeWorkingHours, initialFormState);
  const operation = isActive ? "deactivate" : "activate";

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-1">
        <Button
          type="submit"
          name="operation"
          value={operation}
          variant="ghost"
          pending={pending}
          className="px-2 py-1"
          aria-label={isActive ? "Desactivar intervalo" : "Activar intervalo"}
          title={isActive ? "Desactivar" : "Activar"}
        >
          {isActive ? <PowerOff className="size-4" aria-hidden /> : <Power className="size-4" aria-hidden />}
        </Button>
        <Button
          type="submit"
          name="operation"
          value="delete"
          variant="ghost"
          disabled={pending}
          className="px-2 py-1 hover:text-danger"
          aria-label="Eliminar intervalo"
          title="Eliminar"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-danger">
          {state.message}
        </p>
      )}
      {state.status === "confirm" && state.affected && (
        <ConfirmChange
          message={state.message}
          affected={state.affected}
          operation={state.values?.operation === "delete" ? "delete" : "deactivate"}
          pending={pending}
        />
      )}
    </form>
  );
}

function ConfirmChange({
  message,
  affected,
  operation,
  pending,
}: {
  message?: string;
  affected: AffectedAppointment[];
  operation: "delete" | "deactivate";
  pending: boolean;
}) {
  return (
    <AffectedList message={message} affected={affected}>
      <input type="hidden" name="confirm" value="1" />
      <Button type="submit" name="operation" value={operation} variant="secondary" pending={pending} className="px-3 py-1.5">
        Continuar de todos modos
      </Button>
    </AffectedList>
  );
}
