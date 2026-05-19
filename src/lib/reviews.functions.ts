import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string, storeId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not authorized");
}

async function assertMember(userId: string, storeId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not authorized");
}

/** Public: submit a review. Starts pending unless we can verify a past order. */
export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        storeSlug: z.string().min(1).max(100),
        productId: z.string().uuid(),
        authorName: z.string().min(1).max(120),
        phone: z.string().min(4).max(40).optional().or(z.literal("")),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(2000).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("slug", data.storeSlug)
      .maybeSingle();
    if (!store) throw new Error("Store not found");

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id, store_id")
      .eq("id", data.productId)
      .maybeSingle();
    if (!product || product.store_id !== store.id) {
      throw new Error("Product not found");
    }

    // Verify purchase: customer with matching phone has an order containing this product
    let verified = false;
    const normalize = (s: string) => s.replace(/\D/g, "");
    const phoneDigits = data.phone ? normalize(data.phone) : "";
    if (phoneDigits.length >= 6) {
      const { data: customers } = await supabaseAdmin
        .from("customers")
        .select("id, phone")
        .eq("store_id", store.id);
      const cust = (customers ?? []).find((c) => {
        const d = normalize(c.phone);
        return d && (d.endsWith(phoneDigits) || phoneDigits.endsWith(d));
      });
      if (cust) {
        const { data: orders } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("customer_id", cust.id)
          .eq("store_id", store.id);
        const orderIds = (orders ?? []).map((o) => o.id);
        if (orderIds.length > 0) {
          const { count } = await supabaseAdmin
            .from("order_items")
            .select("id", { count: "exact", head: true })
            .in("order_id", orderIds)
            .eq("product_id", data.productId);
          verified = (count ?? 0) > 0;
        }
      }
    }

    const { error } = await supabaseAdmin.from("product_reviews").insert({
      store_id: store.id,
      product_id: data.productId,
      customer_phone: data.phone || null,
      author_name: data.authorName,
      rating: data.rating,
      comment: data.comment || null,
      verified_purchase: verified,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true, verified };
  });

/** Admin: list reviews (optionally filtered by status). */
export const listReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        storeId: z.string().uuid(),
        status: z.enum(["pending", "approved", "hidden", "all"]).default("pending"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertMember(context.userId, data.storeId);
    let q = supabaseAdmin
      .from("product_reviews")
      .select(
        "id, product_id, author_name, rating, comment, status, verified_purchase, created_at",
      )
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const productIds = Array.from(new Set((rows ?? []).map((r) => r.product_id)));
    const { data: products } = productIds.length
      ? await supabaseAdmin
          .from("products")
          .select("id, name, slug")
          .in("id", productIds)
      : { data: [] };
    const pmap = new Map((products ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({
      ...r,
      product_name: pmap.get(r.product_id)?.name ?? "Unknown",
      product_slug: pmap.get(r.product_id)?.slug ?? null,
    }));
  });

export const setReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        storeId: z.string().uuid(),
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "hidden"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);
    const { error } = await supabaseAdmin
      .from("product_reviews")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("store_id", data.storeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ storeId: z.string().uuid(), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);
    const { error } = await supabaseAdmin
      .from("product_reviews")
      .delete()
      .eq("id", data.id)
      .eq("store_id", data.storeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
