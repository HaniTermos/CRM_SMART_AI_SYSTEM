import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useMyStore } from "@/lib/use-my-store";
import { adjustStock, listInventory } from "@/lib/inventory.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Boxes, AlertTriangle, History, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/inventory")({
  component: InventoryPage,
});

type Reason = "manual" | "restock" | "correction" | "damage" | "return";

function InventoryPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", store?.id],
    enabled: !!store?.id,
    queryFn: () => listInventory({ data: { storeId: store!.id } }),
  });

  const adjust = useMutation({
    mutationFn: (input: {
      productId: string;
      delta: number;
      reason: Reason;
      note: string;
    }) =>
      adjustStock({
        data: {
          storeId: store!.id,
          productId: input.productId,
          delta: input.delta,
          reason: input.reason,
          note: input.note || null,
        },
      }),
    onSuccess: () => {
      toast.success("Stock updated");
      qc.invalidateQueries({ queryKey: ["inventory", store?.id] });
      qc.invalidateQueries({ queryKey: ["products", store?.id] });
      qc.invalidateQueries({ queryKey: ["alerts", store?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const products = data?.products ?? [];
  const adjustments = data?.adjustments ?? [];
  const lowStock = products.filter((p) => (p.stock ?? 0) < 5);
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Boxes className="h-7 w-7 text-primary" />
          Inventory
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track stock levels and record adjustments.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total SKUs" value={products.length} />
        <StatCard label="Low stock (<5)" value={lowStock.length} tone="warn" />
        <StatCard
          label="Total units"
          value={products.reduce((s, p) => s + (p.stock ?? 0), 0)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Stock levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet.</p>
          ) : (
            <div className="divide-y">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        (p.stock ?? 0) < 5 ? "destructive" : "secondary"
                      }
                    >
                      {p.stock} in stock
                    </Badge>
                    <AdjustDialog
                      productName={p.name}
                      currentStock={p.stock ?? 0}
                      onSubmit={(delta, reason, note) =>
                        adjust.mutate({
                          productId: p.id,
                          delta,
                          reason,
                          note,
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Recent adjustments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No adjustments recorded yet.
            </p>
          ) : (
            <div className="divide-y">
              {adjustments.map((a) => {
                const prod = productMap.get(a.product_id);
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {prod?.name ?? "Unknown product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.reason}
                        {a.note ? ` · ${a.note}` : ""} ·{" "}
                        {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={a.delta >= 0 ? "secondary" : "destructive"}
                      className="shrink-0"
                    >
                      {a.delta > 0 ? `+${a.delta}` : a.delta}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn";
}) {
  return (
    <Card className={tone === "warn" && value > 0 ? "border-amber-500/50 bg-amber-500/5" : ""}>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function AdjustDialog({
  productName,
  currentStock,
  onSubmit,
}: {
  productName: string;
  currentStock: number;
  onSubmit: (delta: number, reason: Reason, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("1");
  const [reason, setReason] = useState<Reason>("restock");
  const [note, setNote] = useState("");

  const submit = () => {
    const qty = parseInt(amount, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid positive number");
      return;
    }
    const delta = direction === "add" ? qty : -qty;
    onSubmit(delta, reason, note.trim());
    setOpen(false);
    setAmount("1");
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock: {productName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            Current stock: <span className="font-semibold text-foreground">{currentStock}</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={direction === "add" ? "default" : "outline"}
              className="flex-1 gap-1"
              onClick={() => setDirection("add")}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
            <Button
              type="button"
              variant={direction === "remove" ? "default" : "outline"}
              className="flex-1 gap-1"
              onClick={() => setDirection("remove")}
            >
              <Minus className="h-4 w-4" /> Remove
            </Button>
          </div>
          <div className="grid gap-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as Reason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">Restock</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="manual">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Shipment #1023"
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Save adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
