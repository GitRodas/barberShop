import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">
        {siteConfig.name} · Atención presencial con cita previa.
      </div>
    </footer>
  );
}
