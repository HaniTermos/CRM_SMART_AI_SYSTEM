import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_admin/onboarding")({
  component: Onboarding,
});

const storeSchema = z.object({
  name: z.string().trim().min(2, "Store name is too short").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is too short")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const parsed = storeSchema.safeParse({ name, slug });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setBusy(true);

    // Re-check the live session right before insert. RLS requires
    // owner_user_id = auth.uid(), and a stale/expired session is the
    // most common cause of "new row violates row-level security policy".
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      setBusy(false);
      toast.error("Your session has expired. Please sign in again.");
      navigate({ to: "/login" });
      return;
    }
    const currentUserId = authData.user.id;

    // Create store
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .insert({
        name: parsed.data.name,
        slug: parsed.data.slug,
        owner_user_id: currentUserId,
      })
      .select("id")
      .single();

    if (storeErr || !store) {
      setBusy(false);
      toast.error(storeErr?.message ?? "Could not create store");
      return;
    }

    // Assign owner role
    const { error: roleErr } = await supabase.from("user_roles").insert({
      user_id: currentUserId,
      store_id: store.id,
      role: "owner",
    });

    if (roleErr) {
      setBusy(false);
      toast.error(`Store created, but role assignment failed: ${roleErr.message}`);
      return;
    }

    // Link profile to store
    await supabase.from("profiles").update({ store_id: store.id }).eq("id", currentUserId);

    setBusy(false);
    toast.success("Store created!");
    await qc.invalidateQueries({ queryKey: ["my-store"] });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your store</CardTitle>
          <CardDescription>One last step before you can add products.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || slug === slugify(name)) setSlug(slugify(e.target.value));
                }}
                placeholder="Sunrise Bakery"
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Public URL slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="sunrise-bakery"
                required
                maxLength={40}
              />
              <p className="text-xs text-muted-foreground">
                Your shop will live at <code>/shop/{slug || "your-slug"}</code>
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Creating…" : "Create store"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
