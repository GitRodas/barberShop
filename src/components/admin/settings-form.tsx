"use client";

import { useActionState } from "react";
import { updateSettings } from "@/lib/admin/actions";
import { initialFormState } from "@/lib/forms";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";

const durations = [30, 45, 60, 90, 120].map((minutes) => ({
  value: minutes,
  label: minutes === 60 ? "1 hora" : minutes % 60 === 0 ? `${minutes / 60} horas` : minutes > 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} minutos`,
}));

type Settings = {
  slotMinutes: number;
  minAdvanceMinutes: number;
  bookingHorizonDays: number;
  cancellationMinHours: number;
  maxActiveAppointmentsPerClient: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(updateSettings, initialFormState);
  const value = (key: keyof Settings) => state.values?.[key] ?? String(settings[key]);

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.message && (
        <Alert variant={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Duración de cada corte"
          name="slotMinutes"
          options={durations}
          defaultValue={value("slotMinutes")}
          hint="Las citas ya reservadas conservan su duración."
          errors={state.fieldErrors?.slotMinutes}
        />
        <Field
          label="Antelación mínima para reservar (minutos)"
          name="minAdvanceMinutes"
          type="number"
          inputMode="numeric"
          min={0}
          max={10080}
          defaultValue={value("minAdvanceMinutes")}
          hint="Ej.: 60 = no se puede reservar con menos de 1 hora."
          errors={state.fieldErrors?.minAdvanceMinutes}
        />
        <Field
          label="Días disponibles para reservar"
          name="bookingHorizonDays"
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          defaultValue={value("bookingHorizonDays")}
          hint="Cuántos días hacia adelante ven los clientes."
          errors={state.fieldErrors?.bookingHorizonDays}
        />
        <Field
          label="Antelación mínima para cancelar (horas)"
          name="cancellationMinHours"
          type="number"
          inputMode="numeric"
          min={0}
          max={720}
          defaultValue={value("cancellationMinHours")}
          hint="El cliente no puede cancelar con menos tiempo. Tú siempre puedes."
          errors={state.fieldErrors?.cancellationMinHours}
        />
        <Field
          label="Citas activas por cliente"
          name="maxActiveAppointmentsPerClient"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          defaultValue={value("maxActiveAppointmentsPerClient")}
          errors={state.fieldErrors?.maxActiveAppointmentsPerClient}
        />
      </div>
      <Button type="submit" pending={pending}>
        Guardar configuración
      </Button>
    </form>
  );
}
