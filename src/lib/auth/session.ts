import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Pick<Tables<"profiles">, "full_name" | "phone" | "role">;
};

// getClaims valida el JWT; nunca se confía en la sesión leída de cookies sin verificar.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile) return null;

  return { id: claims.sub, email: claims.email ?? "", profile };
});

export async function requireUser(next = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// La autorización real está en RLS; esto evita mostrar el panel a quien no es admin.
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (user.profile.role !== "admin") redirect("/");
  return user;
}
