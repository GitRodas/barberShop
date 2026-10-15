import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresa un correo válido"));

const newPassword = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres")
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
  .regex(/[0-9]/, "Debe incluir al menos un número");

const fullName = z
  .string()
  .trim()
  .min(2, "Ingresa tu nombre")
  .max(100, "Máximo 100 caracteres");

// Igual que la restricción profiles.phone en la base de datos.
const phone = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(
    z
      .string()
      .regex(/^\+?[0-9 ()-]{7,20}$/, "Ingresa un teléfono válido")
      .nullable(),
  );

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña").max(72),
});

export const registerSchema = z
  .object({
    fullName,
    phone,
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({ fullName, phone });
