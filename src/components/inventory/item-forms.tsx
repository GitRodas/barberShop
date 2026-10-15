"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createItem, registerMovement, toggleItem, updateItem } from "@/lib/inventory/actions";
import { initialFormState } from "@/lib/forms";
import { formatQuantity } from "@/lib/format";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";

export function CreateItemForm() {
  const [state, action, pending] = useActionState(createItem, initialFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && (
        <Alert variant={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nombre" name="name" required maxLength={100} placeholder="Cera mate" defaultValue={state.values?.name} errors={state.fieldErrors?.name} />
        <Field label="Unidad" name="unit" required maxLength={30} placeholder="unidad, ml, caja…" defaultValue={state.values?.unit} errors={state.fieldErrors?.unit} />
        <Field label="Existencia inicial" name="initialQuantity" type="number" inputMode="decimal" min={0} step="0.01" placeholder="0" defaultValue={state.values?.initialQuantity} errors={state.fieldErrors?.initialQuantity} />
        <Field label="Mínimo (alerta)" name="minQuantity" type="number" inputMode="decimal" min={0} step="0.01" placeholder="0" defaultValue={state.values?.minQuantity} errors={state.fieldErrors?.minQuantity} />
      </div>
      <Button type="submit" pending={pending}>
        <Plus className="size-4" aria-hidden />
        Agregar producto
      </Button>
    </form>
  );
}

const movementOptions = [
  { value: "entry", label: "Entrada (suma)" },
  { value: "exit", label: "Salida (resta)" },
  { value: "adjustment", label: "Ajuste (conteo real)" },
];

export function MovementForm({ itemId, unit, quantity }: { itemId: string; unit: string; quantity: number }) {
  const [state, action, pending] = useActionState(registerMovement, initialFormState);
  const [type, setType] = useState(state.values?.type ?? "entry");
  const keep = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} className="space-y-3" noValidate>
      {state.message && (
        <Alert variant={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      )}
      <input type="hidden" name="itemId" value={itemId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Tipo"
          name="type"
          id={`type-${itemId}`}
          options={movementOptions}
          value={type}
          onChange={(event) => setType(event.target.value)}
        />
        <Field
          label={type === "adjustment" ? `Existencia real (${unit})` : `Cantidad (${unit})`}
          name="quantity"
          id={`quantity-${itemId}`}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          required
          hint={type === "exit" ? `Disponible: ${formatQuantity(quantity)}` : type === "adjustment" ? `Actual: ${formatQuantity(quantity)}` : undefined}
          defaultValue={keep?.quantity}
          errors={state.fieldErrors?.quantity}
        />
      </div>
      <Field
        label={type === "adjustment" ? "Motivo (obligatorio)" : "Motivo (opcional)"}
        name="reason"
        id={`reason-${itemId}`}
        maxLength={300}
        placeholder={type === "adjustment" ? "Conteo físico, producto dañado…" : "Compra, uso en servicio…"}
        defaultValue={keep?.reason}
        errors={state.fieldErrors?.reason}
      />
      <Button type="submit" pending={pending} className="px-4 py-2">
        Registrar
      </Button>
    </form>
  );
}

export function EditItemForm({
  id,
  name,
  unit,
  minQuantity,
}: {
  id: string;
  name: string;
  unit: string;
  minQuantity: number;
}) {
  const [state, action, pending] = useActionState(updateItem, initialFormState);
  const value = (key: string, fallback: string) => state.values?.[key] ?? fallback;

  return (
    <form action={action} className="space-y-3" noValidate>
      {state.message && (
        <Alert variant={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      )}
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nombre" name="name" id={`name-${id}`} required maxLength={100} defaultValue={value("name", name)} errors={state.fieldErrors?.name} />
        <Field label="Unidad" name="unit" id={`unit-${id}`} required maxLength={30} defaultValue={value("unit", unit)} errors={state.fieldErrors?.unit} />
        <Field label="Mínimo (alerta)" name="minQuantity" id={`min-${id}`} type="number" inputMode="decimal" min={0} step="0.01" defaultValue={value("minQuantity", String(minQuantity))} errors={state.fieldErrors?.minQuantity} />
      </div>
      <p className="text-xs text-muted">La existencia solo cambia con movimientos, para conservar el historial.</p>
      <Button type="submit" variant="secondary" pending={pending} className="px-4 py-2">
        Guardar cambios
      </Button>
    </form>
  );
}

export function ToggleItemButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [state, action, pending] = useActionState(toggleItem, initialFormState);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={String(!isActive)} />
      <Button type="submit" variant="ghost" pending={pending} className="px-3 py-1.5">
        {isActive ? "Desactivar producto" : "Reactivar producto"}
      </Button>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
