import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

// Marcador temporal para secciones que se implementan en fases posteriores.
export function ComingSoon({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader title={title} />
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
        <Hammer className="size-8 text-accent" aria-hidden />
        <p className="text-muted">Esta sección estará disponible pronto.</p>
        {children}
      </div>
    </div>
  );
}
