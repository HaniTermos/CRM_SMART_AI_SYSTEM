import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/lib/use-my-store";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.number().min(0).max(1_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  status: z.enum(["draft", "active", "archived"]),
  category_id: z.string().uuid().nullable(),
});

export type ProductFormProps = {
  productId?: string; // omit for create
};

export function ProductForm({ productId }: ProductFormProps) {
  const { data: store } = useMyStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load existing product (edit mode)
  const { data: existing } = useQuery({
    queryKey: ["product", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setSlug(existing.slug);
    setDescription(existing.description ?? "");
    setPrice(String(existing.price));
    setStock(String(existing.stock));
    setImageUrl(existing.image_url ?? "");
    setStatus(existing.status);
    setCategoryId(existing.category_id);
  }, [existing]);

  // Categories for select
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("store_id", store!.id)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("No store");
      const parsed = schema.parse({
        name,
        slug,
        description,
        price: Number(price),
        stock: Number(stock),
        image_url: imageUrl,
        status,
        category_id: categoryId,
      });
      const payload = {
        store_id: store.id,
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description || null,
        price: parsed.price,
        stock: parsed.stock,
        image_url: parsed.image_url || null,
        status: parsed.status,
        category_id: parsed.category_id,
      };

      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(productId ? "Product updated" : "Product created");
      qc.invalidateQueries({ queryKey: ["products", store?.id] });
      qc.invalidateQueries({ queryKey: ["product", productId] });
      navigate({ to: "/products" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!productId) return;
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["products", store?.id] });
      navigate({ to: "/products" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!productId && (!slug || slug === slugify(name)))
                    setSlug(slugify(e.target.value));
                }}
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="p-slug">Slug</Label>
              <Input
                id="p-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-price">Price</Label>
              <Input
                id="p-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-stock">Stock</Label>
              <Input
                id="p-stock"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger id="p-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-cat">Category</Label>
              <Select
                value={categoryId ?? "__none"}
                onValueChange={(v) => setCategoryId(v === "__none" ? null : v)}
              >
                <SelectTrigger id="p-cat">
                  <SelectValue placeholder="Uncategorized" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Uncategorized</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Image</Label>
              {imageUrl ? (
                <div className="flex items-start gap-3">
                  <img src={imageUrl} alt="" className="h-24 w-24 rounded-md border object-cover" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImageUrl("")}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
              <Input
                id="p-image-file"
                type="file"
                accept="image/*"
                disabled={uploading || !store}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !store) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Image must be under 5 MB");
                    return;
                  }
                  setUploading(true);
                  try {
                    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
                    const path = `${store.id}/${crypto.randomUUID()}.${ext}`;
                    const { error: upErr } = await supabase.storage
                      .from("product-images")
                      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
                    if (upErr) throw upErr;
                    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
                    setImageUrl(pub.publicUrl);
                    toast.success("Image uploaded");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Upload failed");
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              <Input
                id="p-image"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste an image URL"
                maxLength={500}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={2000}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : productId ? "Save changes" : "Create product"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate({ to: "/products" })}>
                Cancel
              </Button>
            </div>
            {productId ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm("Delete this product? This cannot be undone.")) remove.mutate();
                }}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
