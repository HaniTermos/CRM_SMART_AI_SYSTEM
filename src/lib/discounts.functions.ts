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

const CodeRegex = /^[A-Z0-9_-]+$/;

export const listDiscounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ storeId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);
    const { data: rows, error } = await supabaseAdmin
      .from("discount_codes")
      .select(
        "id, code, type, value, min_subtotal, max_uses, used_count, active, expires_at, created_at",
      )
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        storeId: z.string().uuid(),
        code: z.string().min(2).max(40).regex(CodeRegex),
        type: z.enum(["percent", "fixed"]),
        value: z.number().min(0).max(1_000_000),
        min_subtotal: z.number().min(0).max(1_000_000).default(0),
        max_uses: z.number().int().min(1).max(1_000_000).nullable().optional(),
        expires_at: z.string().datetime().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);
    if (data.type === "percent" && data.value > 100)
      throw new Error("Percent value must be 0–100");
    const { error } = await supabaseAdmin.from("discount_codes").insert({
      store_id: data.storeId,
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      min_subtotal: data.min_subtotal ?? 0,
      max_uses: data.max_uses ?? null,
      expires_at: data.expires_at ?? null,
    });
    if (error) {
      if (error.code === "23505") throw new Error("Code already exists");
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const toggleDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        storeId: z.string().uuid(),
        id: z.string().uuid(),
        active: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);
    const { error } = await supabaseAdmin
      .from("discount_codes")
      .update({ active: data.active })
      .eq("id", data.id)
      .eq("store_id", data.storeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ storeId: z.string().uuid(), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);
    const { error } = await supabaseAdmin
      .from("discount_codes")
      .delete()
      .eq("id", data.id)
      .eq("store_id", data.storeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Public: validate a code for a store + subtotal. No auth required.
 * Returns the resolved discount amount, or an error message.
 */
export const validateDiscount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        storeSlug: z.string().min(1).max(100),
        code: z.string().min(1).max(40),
        subtotal: z.number().min(0).max(10_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("slug", data.storeSlug)
      .maybeSingle();
    if (!store) return { ok: false as const, error: "Store not found" };

    const { data: dc } = await supabaseAdmin
      .from("discount_codes")
      .select("id, code, type, value, min_subtotal, max_uses, used_count, active, expires_at")
      .eq("store_id", store.id)
      .eq("code", data.code.toUpperCase().trim())
      .maybeSingle();

    if (!dc || !dc.active) return { ok: false as const, error: "Invalid code" };
    if (dc.expires_at && new Date(dc.expires_at) < new Date())
      return { ok: false as const, error: "This code has expired" };
    if (dc.max_uses != null && dc.used_count >= dc.max_uses)
      return { ok: false as const, error: "This code has reached its limit" };
    if (data.subtotal < Number(dc.min_subtotal))
      return {
        ok: false as const,
        error: `Minimum subtotal of ${dc.min_subtotal} required`,
      };

    const amount =
      dc.type === "percent"
        ? Math.min(data.subtotal, (data.subtotal * Number(dc.value)) / 100)
        : Math.min(data.subtotal, Number(dc.value));

    return {
      ok: true as const,
      code: dc.code,
      type: dc.type,
      value: Number(dc.value),
      amount: Math.round(amount * 100) / 100,
    };
  });
