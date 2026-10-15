export function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 w-48 rounded bg-border/60" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-2xl bg-border/40" />
        <div className="h-24 rounded-2xl bg-border/40" />
        <div className="h-24 rounded-2xl bg-border/40" />
      </div>
      <div className="h-64 rounded-2xl bg-border/40" />
    </div>
  );
}
