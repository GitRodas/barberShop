import type { Enums } from "@/lib/supabase/database.types";

export const movementLabels: Record<Enums<"inventory_movement_type">, string> = {
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
};
