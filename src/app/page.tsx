import { CalendarCheck, Clock, Scissors } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button-link";

const features = [
  {
    icon: Clock,
    title: `${siteConfig.defaultSlotMinutes} minutos`,
    text: "Cada corte tiene su espacio reservado, sin esperas.",
  },
  {
    icon: CalendarCheck,
    title: "Reserva en línea",
    text: "Elige un horario disponible y gestiona tus citas.",
  },
  {
    icon: Scissors,
    title: "Atención personal",
    text: "Un solo barbero, dedicado a cada cliente.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
          Barbería presencial
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
          El corte que buscas, a la hora que eliges.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          {siteConfig.description}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/reservar">Reservar cita</ButtonLink>
          <ButtonLink href="/registro" variant="secondary">
            Crear cuenta
          </ButtonLink>
        </div>
      </section>

      <section
        aria-label="Características"
        className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-3 sm:px-6"
      >
        {features.map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <Icon className="size-6 text-accent" aria-hidden />
            <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </article>
        ))}
      </section>
    </>
  );
}
