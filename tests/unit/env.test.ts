import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("variables de entorno", () => {
  it("normaliza la URL de Supabase copiada con /rest/v1/", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co/rest/v1/");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
  });

  it("rechaza una clave secreta en la variable pública", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_x");
    expect(() => getPublicEnv()).toThrow();
  });
});
