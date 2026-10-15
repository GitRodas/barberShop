// Solo rutas internas: evita redirecciones abiertas a dominios externos.
export function safeRedirectPath(
  value: unknown,
  fallback = "/",
): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

export const protectedPrefixes = [
  "/reservar",
  "/mis-citas",
  "/perfil",
  "/admin",
] as const;

export const guestOnlyPaths = ["/login", "/registro", "/recuperar-password"] as const;

export function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
