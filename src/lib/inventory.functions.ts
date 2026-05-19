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

export const adjustStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        storeId: z.string().uuid(),
        productId: z.string().uuid(),
        delta: z.number().int().min(-100000).max(100000),
        reason: z.enum(["manual", "restock", "correction", "damage", "return"]),
        note: z.string().max(500).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, stock, store_id")
      .eq("id", data.productId)
      .eq("store_id", data.storeId)
      .single();
    if (pErr) throw new Error(pErr.message);

    const newStock = Math.max(0, (product.stock ?? 0) + data.delta);

    const { error: updErr } = await supabaseAdmin
      .from("products")
      .update({ stock: newStock })
      .eq("id", data.productId);
    if (updErr) throw new Error(updErr.message);

    const { error: insErr } = await supabaseAdmin
      .from("inventory_adjustments")
      .insert({
        store_id: data.storeId,
        product_id: data.productId,
        delta: data.delta,
        reason: data.reason,
        note: data.note ?? null,
        created_by: context.userId,
      });
    if (insErr) throw new Error(insErr.message);

    return { ok: true, newStock };
  });

export const listInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ storeId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertMember(context.userId, data.storeId);

    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, stock, status, image_url, price")
      .eq("store_id", data.storeId)
      .order("stock", { ascending: true });
    if (pErr) throw new Error(pErr.message);

    const { data: adjustments, error: aErr } = await supabaseAdmin
      .from("inventory_adjustments")
      .select("id, product_id, delta, reason, note, created_at, created_by")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (aErr) throw new Error(aErr.message);

    return { products: products ?? [], adjustments: adjustments ?? [] };
  });
