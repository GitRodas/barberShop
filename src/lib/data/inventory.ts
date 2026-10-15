import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import type { Enums, Tables } from "@/lib/supabase/database.types";

export type InventoryItem = Tables<"inventory_items">;
export type MovementType = Enums<"inventory_movement_type">;
export type Movement = Tables<"inventory_movements"> & {
  item: Pick<InventoryItem, "name" | "unit"> | null;
  performer: Pick<Tables<"profiles">, "full_name"> | null;
};

export const MOVEMENTS_PAGE_SIZE = 50;

async function adminClient() {
  await requireAdmin();
  return createClient();
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name");
  if (error) throw new Error("No se pudo cargar el inventario");
  return data;
}

export async function getMovements({
  itemId,
  type,
  page = 1,
}: {
  itemId?: string;
  type?: MovementType;
  page?: number;
}): Promise<{ movements: Movement[]; total: number }> {
  const supabase = await adminClient();
  const from = (page - 1) * MOVEMENTS_PAGE_SIZE;
  let query = supabase
    .from("inventory_movements")
    .select("*, item:inventory_items(name, unit), performer:profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + MOVEMENTS_PAGE_SIZE - 1);
  if (itemId) query = query.eq("item_id", itemId);
  if (type) query = query.eq("type", type);
  const { data, error, count } = await query;
  if (error) throw new Error("No se pudo cargar el historial");
  return { movements: data, total: count ?? 0 };
}
