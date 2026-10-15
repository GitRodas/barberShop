import Link from "next/link";
import { Scissors } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button-link";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-semibold"
        >
          <Scissors className="size-5 text-accent" aria-hidden />
          {siteConfig.name}
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            Ingresar
          </Link>
          <ButtonLink href="/reservar" className="hidden sm:inline-flex">
            Reservar
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
