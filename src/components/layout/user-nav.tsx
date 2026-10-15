import Link from "next/link";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { ButtonLink } from "@/components/ui/button-link";

const linkClass =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted hover:text-foreground";

export async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <Link href="/login" className={linkClass}>
          Ingresar
        </Link>
        <ButtonLink href="/registro" className="hidden sm:inline-flex">
          Crear cuenta
        </ButtonLink>
      </>
    );
  }

  const isAdmin = user.profile.role === "admin";

  return (
    <>
      {isAdmin ? (
        <Link href="/admin" className={linkClass}>
          <LayoutDashboard className="size-4" aria-hidden />
          <span className="hidden sm:inline">Panel</span>
        </Link>
      ) : (
        <Link href="/mis-citas" className={`${linkClass} hidden sm:inline-flex`}>
          Mis citas
        </Link>
      )}
      <Link href="/perfil" className={linkClass} aria-label="Mi perfil">
        <User className="size-4" aria-hidden />
        <span className="hidden max-w-32 truncate md:inline">
          {user.profile.full_name || "Perfil"}
        </span>
      </Link>
      <form action={signOut}>
        <button type="submit" className={linkClass} aria-label="Cerrar sesión">
          <LogOut className="size-4" aria-hidden />
        </button>
      </form>
      {!isAdmin && (
        <ButtonLink href="/reservar" className="hidden sm:inline-flex">
          Reservar
        </ButtonLink>
      )}
    </>
  );
}

export function UserNavFallback() {
  return <div className="h-9 w-24 animate-pulse rounded-full bg-border/60" aria-hidden />;
}
