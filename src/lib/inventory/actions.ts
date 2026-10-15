"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { dbErrorMessage, formValues, validationError, type FormState } from "@/lib/forms";
import {
  createItemSchema,
  movementSchema,
  toggleItemSchema,
  updateItemSchema,
} from "@/lib/validation/inventory";

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, ["name", "unit", "minQuantity", "initialQuantity"]);
  const parsed = createItemSchema.safeParse({
    ...values,
    minQuantity: values.minQuantity || 0,
    initialQuantity: values.initialQuantity || 0,
  });
  if (!parsed.success) return validationError(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_inventory_item", {
    p_name: parsed.data.name,
    p_unit: parsed.data.unit,
    p_min_quantity: parsed.data.minQuantity,
    p_initial_quantity: parsed.data.initialQuantity,
  });
  if (error) return { status: "error", message: dbErrorMessage(error), values };

  refresh();
  return { status: "success", message: `Producto "${parsed.data.name}" creado.` };
}

export async function updateItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, ["id", "name", "unit", "minQuantity"]);
  const parsed = updateItemSchema.safeParse({ ...values, minQuantity: values.minQuantity || 0 });
  if (!parsed.success) return validationError(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: parsed.data.name,
      unit: parsed.data.unit,
      min_quantity: parsed.data.minQuantity,
    })
    .eq("id", parsed.data.id);
  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe un producto con ese nombre." : dbErrorMessage(error),
      values,
    };
  }

  refresh();
  return { status: "success", message: "Producto actualizado.", values };
}

// Desactivar conserva el producto y todo su historial.
export async function toggleItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = toggleItemSchema.safeParse({
    id: formData.get("id"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return { status: "error", message: "Solicitud inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.id);
  if (error) return { status: "error", message: dbErrorMessage(error) };

  refresh();
  return { status: "success" };
}

// La existencia y el movimiento se actualizan juntos en la base de datos, con bloqueo de fila.
export async function registerMovement(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, ["itemId", "type", "quantity", "reason"]);
  const parsed = movementSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_inventory_movement", {
    p_item_id: parsed.data.itemId,
    p_type: parsed.data.type,
    p_quantity: parsed.data.quantity,
    p_reason: parsed.data.reason ?? undefined,
  });
  if (error) return { status: "error", message: dbErrorMessage(error), values };

  refresh();
  return { status: "success", message: "Movimiento registrado.", values: { type: values.type } };
}
