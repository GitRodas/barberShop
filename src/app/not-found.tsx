import { Scissors } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <Scissors className="size-10 text-accent" aria-hidden />
      <h1 className="font-display text-2xl font-semibold">Página no encontrada</h1>
      <p className="text-muted">La página que buscas no existe o fue movida.</p>
      <ButtonLink href="/">Ir al inicio</ButtonLink>
    </div>
  );
}
