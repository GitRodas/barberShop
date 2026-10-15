import { z } from "zod";

const quantity = (label: string) =>
  z.coerce
    .number({ message: `${label} inválida` })
    .min(0, `${label} no puede ser negativa`)
    .max(9_999_999_999, `${label} demasiado grande`)
    .refine((value) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6, "Máximo 2 decimales");

const itemFields = {
  name: z.string().trim().min(1, "Ingresa el nombre").max(100, "Máximo 100 caracteres"),
  unit: z.string().trim().min(1, "Ingresa la unidad").max(30, "Máximo 30 caracteres"),
  minQuantity: quantity("La cantidad mínima"),
};

export const createItemSchema = z.object({
  ...itemFields,
  initialQuantity: quantity("La existencia inicial"),
});

export const updateItemSchema = z.object({ id: z.uuid(), ...itemFields });

export const toggleItemSchema = z.object({
  id: z.uuid(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const movementSchema = z
  .object({
    itemId: z.uuid(),
    type: z.enum(["entry", "exit", "adjustment"]),
    quantity: z.preprocess((value) => (value === "" ? undefined : value), quantity("La cantidad")),
    reason: z
      .string()
      .trim()
      .max(300, "Máximo 300 caracteres")
      .transform((value) => value || null),
  })
  .refine((data) => data.type === "adjustment" || data.quantity > 0, {
    message: "La cantidad debe ser mayor que cero",
    path: ["quantity"],
  })
  .refine((data) => data.type !== "adjustment" || data.reason, {
    message: "Explica el motivo del ajuste",
    path: ["reason"],
  });
