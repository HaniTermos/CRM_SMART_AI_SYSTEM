import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RoleEnum = z.enum(["admin", "staff"]);

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

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        storeId: z.string().uuid(),
        email: z.string().email().max(255),
        role: RoleEnum,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);

    const email = data.email.toLowerCase().trim();
    let foundUserId: string | null = null;
    let page = 1;
    while (page <= 20) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      const match = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (match) {
        foundUserId = match.id;
        break;
      }
      if (list.users.length < 200) break;
      page++;
    }
    if (!foundUserId) {
      throw new Error("No account found with that email. Ask them to sign up first.");
    }

    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: foundUserId, store_id: data.storeId, role: data.role });
    if (insErr) {
      if (insErr.code === "23505") throw new Error("That user already has a role on this store.");
      throw new Error(insErr.message);
    }
    return { ok: true, userId: foundUserId };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ storeId: z.string().uuid(), userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);

    const { data: store, error: sErr } = await supabaseAdmin
      .from("stores")
      .select("owner_user_id")
      .eq("id", data.storeId)
      .single();
    if (sErr) throw new Error(sErr.message);
    if (store.owner_user_id === data.userId) throw new Error("Cannot remove the store owner.");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("store_id", data.storeId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTeamMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ storeId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertMember(context.userId, data.storeId);

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: true });
    if (rolesErr) throw new Error(rolesErr.message);

    const out: Array<{
      id: string;
      user_id: string;
      role: string;
      email: string | null;
      name: string | null;
      created_at: string;
    }> = [];
    for (const r of roles ?? []) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      const { data: p } = await supabaseAdmin.from("profiles").select("name").eq("id", r.user_id).maybeSingle();
      out.push({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        email: u.user?.email ?? null,
        name: p?.name ?? null,
        created_at: r.created_at,
      });
    }
    return out;
  });

export const updateStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        storeId: z.string().uuid(),
        name: z.string().min(1).max(120),
        currency: z.string().min(1).max(8),
        shipping_fee: z.number().min(0).max(1_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.storeId);
    const { error } = await supabaseAdmin
      .from("stores")
      .update({
        name: data.name,
        currency: data.currency,
        shipping_fee: data.shipping_fee,
      })
      .eq("id", data.storeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
