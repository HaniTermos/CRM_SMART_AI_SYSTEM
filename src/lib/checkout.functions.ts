import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CheckoutSchema = z.object({
  storeSlug: z.string().min(1).max(100),
  customer: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().min(4).max(40),
    email: z.string().email().max(160).optional().or(z.literal("")),
  }),
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional().or(z.literal("")),
    city: z.string().min(1).max(120),
    region: z.string().max(120).optional().or(z.literal("")),
    postal_code: z.string().max(40).optional().or(z.literal("")),
    country: z.string().max(80).optional().or(z.literal("")),
  }),
  notes: z.string().max(1000).optional().or(z.literal("")),
  discount_code: z.string().min(1).max(40).optional().or(z.literal("")),
  items: z
    .array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) }))
    .min(1)
    .max(50),
});

function genOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    // Look up store
    const { data: store, error: storeErr } = await supabaseAdmin
      .from("stores")
      .select("id, name, shipping_fee, currency")
      .eq("slug", data.storeSlug)
      .maybeSingle();
    if (storeErr) throw new Error(storeErr.message);
    if (!store) throw new Error("Store not found");

    // Fetch products (trust DB, not client)
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, status, stock, store_id")
      .in("id", ids);
    if (prodErr) throw new Error(prodErr.message);

    const itemsResolved = data.items.map((i) => {
      const p = products?.find((x) => x.id === i.product_id);
      if (!p) throw new Error(`Product ${i.product_id} not found`);
      if (p.store_id !== store.id) throw new Error("Product does not belong to this store");
      if (p.status !== "active") throw new Error(`Product not available: ${p.name}`);
      return {
        product_id: p.id,
        product_name: p.name,
        unit_price: Number(p.price),
        quantity: i.quantity,
        subtotal: Number(p.price) * i.quantity,
      };
    });

    const subtotal = itemsResolved.reduce((s, i) => s + i.subtotal, 0);
    const shipping_fee = Number(store.shipping_fee) || 0;

    // Apply discount code (re-validated server-side)
    let discount_amount = 0;
    let discount_code: string | null = null;
    if (data.discount_code && data.discount_code.trim()) {
      const code = data.discount_code.toUpperCase().trim();
      const { data: dc } = await supabaseAdmin
        .from("discount_codes")
        .select("id, code, type, value, min_subtotal, max_uses, used_count, active, expires_at")
        .eq("store_id", store.id)
        .eq("code", code)
        .maybeSingle();

      if (!dc || !dc.active) throw new Error("Invalid discount code");
      if (dc.expires_at && new Date(dc.expires_at) < new Date())
        throw new Error("Discount code has expired");
      if (dc.max_uses != null && dc.used_count >= dc.max_uses)
        throw new Error("Discount code has reached its usage limit");
      if (subtotal < Number(dc.min_subtotal))
        throw new Error(`Minimum subtotal of ${dc.min_subtotal} required for this code`);

      discount_amount =
        dc.type === "percent"
          ? Math.min(subtotal, (subtotal * Number(dc.value)) / 100)
          : Math.min(subtotal, Number(dc.value));
      discount_amount = Math.round(discount_amount * 100) / 100;
      discount_code = dc.code;

      await supabaseAdmin
        .from("discount_codes")
        .update({ used_count: (dc.used_count ?? 0) + 1 })
        .eq("id", dc.id);
    }

    const total = Math.max(0, subtotal - discount_amount) + shipping_fee;

    // Upsert customer by (store_id, phone)
    const phone = data.customer.phone.trim();
    const { data: existingCust } = await supabaseAdmin
      .from("customers")
      .select("id, total_orders, total_spent")
      .eq("store_id", store.id)
      .eq("phone", phone)
      .maybeSingle();

    let customerId: string;
    if (existingCust) {
      customerId = existingCust.id;
      await supabaseAdmin
        .from("customers")
        .update({
          name: data.customer.name,
          email: data.customer.email || null,
          total_orders: (existingCust.total_orders ?? 0) + 1,
          total_spent: Number(existingCust.total_spent ?? 0) + total,
          last_order_at: new Date().toISOString(),
          segment: "active",
        })
        .eq("id", customerId);
    } else {
      const { data: newCust, error: custErr } = await supabaseAdmin
        .from("customers")
        .insert({
          store_id: store.id,
          name: data.customer.name,
          phone,
          email: data.customer.email || null,
          total_orders: 1,
          total_spent: total,
          last_order_at: new Date().toISOString(),
          segment: "new",
        })
        .select("id")
        .single();
      if (custErr || !newCust) throw new Error(custErr?.message ?? "Customer create failed");
      customerId = newCust.id;
    }

    // Insert order
    const orderNumber = genOrderNumber();
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        store_id: store.id,
        customer_id: customerId,
        order_number: orderNumber,
        status: "pending",
        payment_method: "cash_on_delivery",
        subtotal,
        shipping_fee,
        total,
        discount_code,
        discount_amount,
        shipping_address: data.address,
        notes: data.notes || null,
      })
      .select("id, order_number")
      .single();
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Order create failed");

    // Insert items
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(
      itemsResolved.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name,
        unit_price: i.unit_price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    // Activity
    await supabaseAdmin.from("customer_activities").insert({
      store_id: store.id,
      customer_id: customerId,
      type: "order_placed",
      payload: { order_id: order.id, order_number: order.order_number, total },
    });

    return {
      order_number: order.order_number,
      total,
      currency: store.currency,
    };
  });
