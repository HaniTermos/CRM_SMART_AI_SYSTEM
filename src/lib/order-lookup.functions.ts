import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Public order lookup. Verifies order number + matching customer phone (last 4 digits
 * at minimum) before returning order details. No auth required.
 */
export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        storeSlug: z.string().min(1).max(100),
        orderNumber: z.string().min(1).max(80),
        phone: z.string().min(4).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, name, currency")
      .eq("slug", data.storeSlug)
      .maybeSingle();
    if (!store) return { ok: false as const, error: "Store not found" };

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, status, subtotal, shipping_fee, discount_code, discount_amount, total, shipping_address, notes, created_at, updated_at, customer_id",
      )
      .eq("store_id", store.id)
      .eq("order_number", data.orderNumber.trim().toUpperCase())
      .maybeSingle();

    if (!order) {
      return { ok: false as const, error: "Order not found" };
    }

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("phone, name")
      .eq("id", order.customer_id)
      .maybeSingle();

    if (!customer) return { ok: false as const, error: "Order not found" };

    const normalize = (s: string) => s.replace(/\D/g, "");
    const inputDigits = normalize(data.phone);
    const custDigits = normalize(customer.phone);
    const match =
      inputDigits.length >= 4 &&
      (custDigits.endsWith(inputDigits) || inputDigits.endsWith(custDigits));
    if (!match) {
      return { ok: false as const, error: "Phone number does not match" };
    }

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("id, product_name, quantity, unit_price, subtotal")
      .eq("order_id", order.id);

    return {
      ok: true as const,
      store: { name: store.name, currency: store.currency },
      customer: { name: customer.name },
      order: {
        order_number: order.order_number,
        status: order.status,
        subtotal: Number(order.subtotal),
        shipping_fee: Number(order.shipping_fee),
        discount_code: order.discount_code,
        discount_amount: Number(order.discount_amount ?? 0),
        total: Number(order.total),
        shipping_address: order.shipping_address,
        notes: order.notes,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      items: items ?? [],
    };
  });
