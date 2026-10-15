import Link from "next/link";
import { Suspense } from "react";
import { Scissors } from "lucide-react";
import { siteConfig } from "@/config/site";
import { UserNav, UserNavFallback } from "@/components/layout/user-nav";

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
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          <Suspense fallback={<UserNavFallback />}>
            <UserNav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
