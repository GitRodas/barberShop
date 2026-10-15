import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { PanelSkeleton } from "@/components/admin/panel-skeleton";
import { movementLabels } from "@/components/inventory/labels";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  MOVEMENTS_PAGE_SIZE,
  getInventoryItems,
  getMovements,
  type MovementType,
} from "@/lib/data/inventory";
import { formatQuantity } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Movimientos de inventario" };

const types = Object.keys(movementLabels) as MovementType[];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function InventoryMovementsPage({
  searchParams,
}: PageProps<"/admin/inventario/movimientos">) {
  return (
    <>
      <Link
        href="/admin/inventario"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Inventario
      </Link>
      <PageHeader title="Historial de movimientos" description="Entradas, salidas y ajustes. El historial no se puede modificar." />
      <div className="mt-6">
        <Suspense fallback={<PanelSkeleton />}>
          <Movements searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Movements({
  searchParams,
}: Pick<PageProps<"/admin/inventario/movimientos">, "searchParams">) {
  const params = await searchParams;
  const itemId = typeof params.producto === "string" && uuidPattern.test(params.producto) ? params.producto : undefined;
  const type = types.find((t) => t === params.tipo);
  const page = Math.max(1, Number.parseInt(String(params.pagina ?? "1"), 10) || 1);

  const [items, { movements, total }] = await Promise.all([
    getInventoryItems(),
    getMovements({ itemId, type, page }),
  ]);
  const pages = Math.max(1, Math.ceil(total / MOVEMENTS_PAGE_SIZE));
  const pageHref = (p: number) => {
    const query = new URLSearchParams();
    if (itemId) query.set("producto", itemId);
    if (type) query.set("tipo", type);
    query.set("pagina", String(p));
    return `/admin/inventario/movimientos?${query}`;
  };

  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1.5 text-sm">
          <span className="block font-medium">Producto</span>
          <select name="producto" defaultValue={itemId ?? ""} className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base sm:text-sm">
            <option value="">Todos</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.is_active ? "" : " (desactivado)"}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm sm:w-48">
          <span className="block font-medium">Tipo</span>
          <select name="tipo" defaultValue={type ?? ""} className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base sm:text-sm">
            <option value="">Todos</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {movementLabels[t]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {movements.length === 0 ? (
        <EmptyState title="No hay movimientos" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-border text-left text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
                <th scope="col" className="px-4 py-3 font-medium">Producto</th>
                <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Cambio</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Queda</th>
                <th scope="col" className="px-4 py-3 font-medium">Motivo</th>
                <th scope="col" className="px-4 py-3 font-medium">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(m.created_at)}</td>
                  <td className="px-4 py-3">{m.item?.name}</td>
                  <td className="px-4 py-3">{movementLabels[m.type]}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right tabular-nums ${m.quantity_delta < 0 ? "text-danger" : "text-success"}`}>
                    {m.quantity_delta > 0 ? "+" : "−"}
                    {formatQuantity(Math.abs(m.quantity_delta))} {m.item?.unit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatQuantity(m.quantity_after)}</td>
                  <td className="max-w-56 break-words px-4 py-3 text-muted">{m.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{m.performer?.full_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className="text-accent hover:underline">← Anteriores</Link> : <span />}
          <span className="text-muted">Página {page} de {pages}</span>
          {page < pages ? <Link href={pageHref(page + 1)} className="text-accent hover:underline">Siguientes →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
