type AuthCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}

export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-4 w-24 rounded bg-border" />
          <div className="h-10 rounded-lg bg-border/60" />
        </div>
      ))}
      <div className="h-10 rounded-full bg-border/60" />
    </div>
  );
}
