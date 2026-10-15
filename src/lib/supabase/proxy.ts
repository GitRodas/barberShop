import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasPublicEnv } from "@/lib/env";

// Refresca la sesión de Supabase en cada petición. No sustituye la autorización en servidor ni RLS.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasPublicEnv()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Valida el JWT contra las claves del proyecto; no ejecutar código entre la creación del cliente y esta llamada.
  await supabase.auth.getClaims();

  return response;
}
