export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header>
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      {description && <p className="mt-2 text-muted">{description}</p>}
    </header>
  );
}
