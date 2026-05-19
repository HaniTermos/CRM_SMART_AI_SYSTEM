import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-context";
import { placeOrder } from "@/lib/checkout.functions";
import { validateDiscount } from "@/lib/discounts.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { slug } = useParams({ from: "/shop/$slug/checkout" });
  const navigate = useNavigate();
  const cart = useCart();
  const placeOrderFn = useServerFn(placeOrder);
  const validateFn = useServerFn(validateDiscount);
  const [submitting, setSubmitting] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [applied, setApplied] = useState<{ code: string; amount: number } | null>(null);
  const [applying, setApplying] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "",
    notes: "",
  });

  const { data: store } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("currency, shipping_fee")
        .eq("slug", slug)
        .maybeSingle();
      return data;
    },
  });

  const shipping = Number(store?.shipping_fee ?? 0);
  const discountAmount = applied?.amount ?? 0;
  const total =
    Math.max(0, cart.subtotal - discountAmount) +
    (cart.items.length > 0 ? shipping : 0);

  const applyCode = async () => {
    if (!discountInput.trim()) return;
    setApplying(true);
    try {
      const res = await validateFn({
        data: {
          storeSlug: slug,
          code: discountInput,
          subtotal: cart.subtotal,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        setApplied(null);
      } else {
        setApplied({ code: res.code, amount: res.amount });
        toast.success(`Code ${res.code} applied`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not validate code");
    } finally {
      setApplying(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <p>Your cart is empty.</p>
        <Link to="/shop/$slug" params={{ slug }}>
          <Button>Continue shopping</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.line1 || !form.city) {
      toast.error("Please fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await placeOrderFn({
        data: {
          storeSlug: slug,
          customer: { name: form.name, phone: form.phone, email: form.email || undefined },
          address: {
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            region: form.region || undefined,
            postal_code: form.postal_code || undefined,
            country: form.country || undefined,
          },
          notes: form.notes || undefined,
          discount_code: applied?.code || undefined,
          items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        },
      });
      cart.clear();
      navigate({
        to: "/shop/$slug/thanks/$orderNumber",
        params: { slug, orderNumber: res.order_number },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
      <div className="space-y-6 md:col-span-2">
        <section className="space-y-3 rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Your details</h2>
          <Field label="Full name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        </section>

        <section className="space-y-3 rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Shipping address</h2>
          <Field label="Address line 1 *" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} />
          <Field label="Address line 2" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field label="Region" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
            <Field label="Postal code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} />
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border bg-card p-5">
          <Label htmlFor="notes" className="font-semibold">Order notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Delivery instructions, preferred time, etc."
          />
        </section>
      </div>

      <aside className="space-y-3 rounded-lg border bg-card p-5 text-sm">
        <h2 className="font-semibold">Order summary</h2>
        <div className="space-y-2">
          {cart.items.map((i) => (
            <div key={i.product_id} className="flex justify-between gap-2">
              <span className="truncate">{i.name} × {i.quantity}</span>
              <span>{store?.currency} {(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t pt-2">
          <Label className="text-xs font-medium">Discount code</Label>
          <div className="flex gap-2">
            <Input
              value={discountInput}
              onChange={(e) =>
                setDiscountInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
              }
              placeholder="SUMMER10"
              maxLength={40}
              className="h-9"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={applyCode}
              disabled={applying || !discountInput.trim()}
            >
              {applying ? "…" : "Apply"}
            </Button>
          </div>
          {applied ? (
            <p className="text-xs text-green-600">
              Code <strong>{applied.code}</strong> applied (−{store?.currency}{" "}
              {applied.amount.toFixed(2)}){" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setApplied(null);
                  setDiscountInput("");
                }}
              >
                remove
              </button>
            </p>
          ) : null}
        </div>
        <div className="space-y-1 border-t pt-2">
          <div className="flex justify-between"><span>Subtotal</span><span>{store?.currency} {cart.subtotal.toFixed(2)}</span></div>
          {applied ? (
            <div className="flex justify-between text-green-600">
              <span>Discount ({applied.code})</span>
              <span>−{store?.currency} {applied.amount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between"><span>Shipping</span><span>{store?.currency} {shipping.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span><span>{store?.currency} {total.toFixed(2)}</span>
          </div>
        </div>
        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          Payment: <strong>Cash on delivery</strong>. You pay when your order arrives.
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Placing order…" : "Place order"}
        </Button>
      </aside>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
