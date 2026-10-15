"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <TriangleAlert className="size-10 text-danger" aria-hidden />
      <h1 className="font-display text-2xl font-semibold">Algo salió mal</h1>
      <p className="text-muted">No pudimos cargar esta página. Inténtalo de nuevo en unos segundos.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>Reintentar</Button>
        <ButtonLink href="/" variant="secondary">
          Ir al inicio
        </ButtonLink>
      </div>
    </div>
  );
}
