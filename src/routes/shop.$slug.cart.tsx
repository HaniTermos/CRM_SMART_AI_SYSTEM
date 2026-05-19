import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/shop/$slug/cart")({
  component: CartPage,
});

function CartPage() {
  const { slug } = useParams({ from: "/shop/$slug/cart" });
  const cart = useCart();

  const { data: store } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const res = await api.get(`/public/stores/${slug}`);
      return res.data.data;
    },
  });

  const shipping = Number(store?.shipping_fee ?? 0);
  const total = cart.subtotal + (cart.items.length > 0 ? shipping : 0);

  if (cart.items.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link to="/shop/$slug" params={{ slug }}>
          <Button>Continue shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Cart</h1>
      <div className="divide-y rounded-lg border bg-card">
        {cart.items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-4 p-4">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded object-cover" />
            ) : (
              <div className="h-16 w-16 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {store?.currency} {item.price.toFixed(2)}
              </p>
            </div>
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => cart.setQty(item.product_id, Number(e.target.value) || 1)}
              className="w-20"
            />
            <p className="w-24 text-right font-medium">
              {store?.currency} {(item.price * item.quantity).toFixed(2)}
            </p>
            <Button variant="ghost" size="icon" onClick={() => cart.remove(item.product_id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="ml-auto w-full max-w-sm space-y-2 rounded-lg border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{store?.currency} {cart.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{store?.currency} {shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{store?.currency} {total.toFixed(2)}</span>
        </div>
        <Link to="/shop/$slug/checkout" params={{ slug }} className="block pt-2">
          <Button className="w-full">Checkout (cash on delivery)</Button>
        </Link>
      </div>
    </div>
  );
}
