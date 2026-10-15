import { z } from "zod";

// Acepta la URL tal como se copia del panel (con /rest/v1/ o barra final) y la deja en la base.
function normalizeSupabaseUrl(value: string | undefined): string | undefined {
  return value?.trim().replace(/\/(rest|auth)\/v1\/?$/, "").replace(/\/+$/, "");
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(1)
    // Una clave secreta en una variable NEXT_PUBLIC_* podría terminar expuesta en el navegador.
    .refine((key) => !key.startsWith("sb_secret_"), "Se configuró una clave secreta como clave pública"),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

// Las variables NEXT_PUBLIC_* deben referenciarse de forma literal para que Next.js las incruste en el cliente.
export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL?.trim() || undefined,
  });
  if (!parsed.success) {
    throw new Error(
      `Variables de entorno de Supabase inválidas: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}. Revisa .env.local o la configuración de Vercel.`,
    );
  }
  return parsed.data;
}

export function hasPublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
