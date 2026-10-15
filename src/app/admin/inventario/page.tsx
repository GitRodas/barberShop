import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { History, PackageX, TriangleAlert } from "lucide-react";
import { PanelSkeleton } from "@/components/admin/panel-skeleton";
import {
  CreateItemForm,
  EditItemForm,
  MovementForm,
  ToggleItemButton,
} from "@/components/inventory/item-forms";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getInventoryItems, type InventoryItem } from "@/lib/data/inventory";
import { formatQuantity } from "@/lib/format";

export const metadata: Metadata = { title: "Inventario" };

export default function InventoryPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Inventario" description="Productos, existencias y alertas." />
        <Link
          href="/admin/inventario/movimientos"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-accent"
        >
          <History className="size-4" aria-hidden />
          Historial de movimientos
        </Link>
      </div>
      <div className="mt-6">
        <Suspense fallback={<PanelSkeleton />}>
          <Inventory />
        </Suspense>
      </div>
    </>
  );
}

const isLow = (item: InventoryItem) => item.is_active && item.quantity <= item.min_quantity;

function ItemCard({ item }: { item: InventoryItem }) {
  const low = isLow(item);
  return (
    <li
      className={`rounded-xl border bg-surface p-4 ${low ? "border-danger/40" : "border-border"} ${
        item.is_active ? "" : "opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium">
            {item.name}
            {!item.is_active && <span className="ml-2 text-xs text-muted">(desactivado)</span>}
          </p>
          <p className="text-sm text-muted">Mínimo: {formatQuantity(item.min_quantity)} {item.unit}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-semibold tabular-nums ${low ? "text-danger" : ""}`}>
            {formatQuantity(item.quantity)}
          </p>
          <p className="text-xs text-muted">{item.unit}</p>
          {low && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-danger">
              <TriangleAlert className="size-3.5" aria-hidden />
              Existencia baja
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-border pt-3">
        {item.is_active && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-accent">Registrar movimiento</summary>
            <div className="mt-3">
              <MovementForm itemId={item.id} unit={item.unit} quantity={item.quantity} />
            </div>
          </details>
        )}
        <details>
          <summary className="cursor-pointer text-sm font-medium text-muted hover:text-foreground">
            Editar producto
          </summary>
          <div className="mt-3 space-y-3">
            <EditItemForm id={item.id} name={item.name} unit={item.unit} minQuantity={item.min_quantity} />
            <ToggleItemButton id={item.id} isActive={item.is_active} />
          </div>
        </details>
        <Link
          href={`/admin/inventario/movimientos?producto=${item.id}`}
          className="inline-block text-sm text-muted hover:text-foreground"
        >
          Ver historial
        </Link>
      </div>
    </li>
  );
}

async function Inventory() {
  const items = await getInventoryItems();
  const low = items.filter(isLow);

  return (
    <div className="space-y-8">
      {low.length > 0 && (
        <section role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm">
          <h2 className="flex items-center gap-2 font-medium text-danger">
            <PackageX className="size-4" aria-hidden />
            {low.length === 1 ? "1 producto con existencia baja" : `${low.length} productos con existencia baja`}
          </h2>
          <ul className="mt-2 space-y-1 pl-6">
            {low.map((item) => (
              <li key={item.id}>
                {item.name}: {formatQuantity(item.quantity)} {item.unit} (mínimo {formatQuantity(item.min_quantity)})
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-medium">Nuevo producto</h2>
        <CreateItemForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Productos</h2>
        {items.length === 0 ? (
          <EmptyState title="Aún no hay productos">Agrega tu primer producto con el formulario de arriba.</EmptyState>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
