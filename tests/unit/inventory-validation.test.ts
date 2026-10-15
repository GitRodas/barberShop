import { describe, expect, it } from "vitest";
import { createItemSchema, movementSchema } from "@/lib/validation/inventory";

const itemId = "6f1c1f1e-2b8c-4a35-9a51-0f6f0f6f0f6f";

describe("validación de inventario", () => {
  it("rechaza cantidades negativas y más de 2 decimales", () => {
    expect(createItemSchema.safeParse({ name: "Cera", unit: "u", minQuantity: -1, initialQuantity: 0 }).success).toBe(false);
    expect(createItemSchema.safeParse({ name: "Cera", unit: "u", minQuantity: 0, initialQuantity: "1.234" }).success).toBe(false);
    expect(createItemSchema.safeParse({ name: "Cera", unit: "u", minQuantity: "0.29", initialQuantity: "10.5" }).success).toBe(true);
  });

  it("exige cantidad positiva en entradas y salidas", () => {
    expect(movementSchema.safeParse({ itemId, type: "exit", quantity: "0", reason: "" }).success).toBe(false);
    expect(movementSchema.safeParse({ itemId, type: "entry", quantity: "", reason: "" }).success).toBe(false);
    expect(movementSchema.safeParse({ itemId, type: "entry", quantity: "-2", reason: "" }).success).toBe(false);
    expect(movementSchema.safeParse({ itemId, type: "exit", quantity: "2", reason: "" }).success).toBe(true);
  });

  it("los ajustes requieren motivo y permiten existencia 0", () => {
    expect(movementSchema.safeParse({ itemId, type: "adjustment", quantity: "0", reason: "" }).success).toBe(false);
    expect(movementSchema.safeParse({ itemId, type: "adjustment", quantity: "0", reason: "Conteo" }).success).toBe(true);
  });
});
