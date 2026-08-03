import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useMyStore } from "@/lib/use-my-store";
import {
  listDiscounts,
  createDiscount,
  toggleDiscount,
  deleteDiscount,
} from "@/lib/discounts.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/discounts")({
  component: DiscountsPage,
});

function DiscountsPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["discounts", store?.id],
    enabled: !!store?.id,
    queryFn: () => listDiscounts({ data: { storeId: store!.id } }),
  });

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [minSubtotal, setMinSubtotal] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createDiscount({
        data: {
          storeId: store!.id,
          code: code.toUpperCase().trim(),
          type,
          value: Number(value) || 0,
          min_subtotal: Number(minSubtotal) || 0,
          max_uses: maxUses ? Number(maxUses) : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        },
      }),
    onSuccess: () => {
      toast.success("Discount code created");
      setCode("");
      setValue("10");
      setMinSubtotal("0");
      setMaxUses("");
      setExpiresAt("");
      qc.invalidateQueries({ queryKey: ["discounts", store?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      toggleDiscount({ data: { storeId: store!.id, ...input } }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["discounts", store?.id] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      deleteDiscount({ data: { storeId: store!.id, id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["discounts", store?.id] });
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <TicketPercent className="h-7 w-7 text-primary" />
          Discount codes
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create promo codes customers can apply at checkout.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Code</Label>
              <Input
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                }
                placeholder="SUMMER10"
                maxLength={40}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Value</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Min subtotal</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={minSubtotal}
                onChange={(e) => setMinSubtotal(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Max uses (optional)</Label>
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div className="grid gap-2">
              <Label>Expires (optional)</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => create.mutate()}
              disabled={!code || create.isPending}
            >
              {create.isPending ? "Creating…" : "Create code"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All codes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No codes yet.</p>
          ) : (
            <div className="divide-y">
              {codes.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                const usedUp =
                  c.max_uses != null && (c.used_count ?? 0) >= c.max_uses;
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-muted px-2 py-0.5 text-sm font-semibold">
                          {c.code}
                        </code>
                        <Badge variant="secondary">
                          {c.type === "percent"
                            ? `${c.value}% off`
                            : `${c.value} off`}
                        </Badge>
                        {expired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : null}
                        {usedUp ? (
                          <Badge variant="destructive">Used up</Badge>
                        ) : null}
                        {!c.active ? (
                          <Badge variant="outline">Disabled</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Min subtotal: {c.min_subtotal} · Uses:{" "}
                        {c.used_count}
                        {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                        {c.expires_at
                          ? ` · Expires ${new Date(c.expires_at).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={c.active}
                        onCheckedChange={(v) =>
                          toggle.mutate({ id: c.id, active: v })
                        }
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete code ${c.code}?`))
                            remove.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
