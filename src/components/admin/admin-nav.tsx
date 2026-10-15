"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, LayoutDashboard, Package, Settings } from "lucide-react";

const items = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/citas", label: "Citas", icon: CalendarDays },
  { href: "/admin/horarios", label: "Horarios", icon: Clock },
  { href: "/admin/inventario", label: "Inventario", icon: Package },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-accent font-medium text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
