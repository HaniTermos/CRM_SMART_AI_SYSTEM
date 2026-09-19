import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    X,
    Edit3,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Clock,
    DollarSign,
    QrCode,
    GripVertical,
    Copy,
    Check,
    ChevronDown,
    Loader2,
    ImageIcon,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore, type MyStore } from "@/lib/use-my-store";
import { IOSBadge } from "@/components/ui/ios-badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_admin/menu")({
    component: MenuRoute,
});

export interface ApiCategory {
    id: string;
    store_id: string;
    name: string;
    slug: string;
    position: number;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface ModifierOption {
    id: string;
    name: string;
    price: number;
}

export interface ModifierGroup {
    id: string;
    name: string;
    required: boolean;
    multi_select: boolean;
    options: ModifierOption[];
}

export interface ApiProduct {
    id: string;
    store_id: string;
    category_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    image_url: string | null;
    status: "draft" | "active" | "archived";
    prep_time: number;
    is_available: boolean;
    is_featured: boolean;
    dietary_tags: string[];
    allergens: string[];
    modifiers: ModifierGroup[];
    created_at: string;
    updated_at: string;
}

function slugify(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 60);
}

function MenuRoute() {
    const queryClient = useQueryClient();
    const { user, loading: authLoading } = useAuth();
    const { data: store, isLoading: storeLoading } = useMyStore();
    const storeId = store?.id;

    const [activeCat, setActiveCat] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [modal, setModal] = useState<
        | null
        | { type: "product"; data?: ApiProduct }
        | { type: "category"; data?: ApiCategory }
        | { type: "modifier"; product?: ApiProduct }
    >(null);
    const [showQR, setShowQR] = useState(false);
    const [categoryDragId, setCategoryDragId] = useState<string | null>(null);

    const categoriesQuery = useQuery({
        queryKey: ["categories", storeId],
        enabled: !!storeId,
        queryFn: async () => {
            const res = await api.get(`/categories/${storeId}`);
            return (res.data.data as ApiCategory[]).sort((a, b) => a.position - b.position);
        },
    });

    const productsQuery = useQuery({
        queryKey: ["products", storeId],
        enabled: !!storeId,
        queryFn: async () => {
            const res = await api.get(`/products/${storeId}`);
            return res.data.data as ApiProduct[];
        },
    });

    const categories = categoriesQuery.data ?? [];
    const products = productsQuery.data ?? [];

    const isLoading = authLoading || storeLoading || categoriesQuery.isLoading || productsQuery.isLoading;

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchCat = activeCat === "all" ? true : p.category_id === activeCat;
            const matchSearch = (p.name + " " + (p.description ?? "")).toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, activeCat, search]);

    const toggleAvailabilityMutation = useMutation({
        mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
            await api.put(`/products/${storeId}/${id}`, { is_available: isAvailable });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", storeId] }),
    });

    const deleteProductMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/products/${storeId}/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
            toast.success("Item deleted");
        },
    });

    const duplicateProductMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/products/${storeId}/${id}/duplicate`);
            return res.data.data as ApiProduct;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
            toast.success("Item duplicated");
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/categories/${storeId}/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
            toast.success("Category deleted");
        },
    });

    const reorderCategoryMutation = useMutation({
        mutationFn: async (orderedIds: string[]) => {
            await api.patch(`/categories/${storeId}/reorder`, { orderedIds });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories", storeId] }),
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: async (payload: { ids: string[]; updates: Partial<ApiProduct> }) => {
            const res = await api.patch(`/products/${storeId}/bulk`, payload);
            return res.data.data as ApiProduct[];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
            setSelectedIds([]);
            toast.success("Items updated");
        },
    });

    const handleCategoryDrop = (targetId: string) => {
        if (!categoryDragId || categoryDragId === targetId) return;
        const ids = categories.map((c) => c.id);
        const from = ids.indexOf(categoryDragId);
        const to = ids.indexOf(targetId);
        ids.splice(from, 1);
        ids.splice(to, 0, categoryDragId);
        reorderCategoryMutation.mutate(ids);
        setCategoryDragId(null);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    if (isLoading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center text-adaptive-muted gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                Loading menu...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="h-96 flex items-center justify-center text-adaptive-muted">
                Please sign in to manage your menu.
            </div>
        );
    }

    if (!storeId) {
        return (
            <div className="h-96 flex items-center justify-center text-adaptive-muted">
                Create a store first to manage the menu.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-adaptive">Menu Manager</h1>
                    <p className="text-sm text-adaptive-muted">
                        {products.length} items across {categories.length} categories
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowQR(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-adaptive text-adaptive text-sm font-medium hover:shadow-lg transition-shadow"
                    >
                        <QrCode className="h-4 w-4" /> QR Preview
                    </button>
                    <button
                        onClick={() => setModal({ type: "product" })}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="h-4 w-4" /> Add Item
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                <button
                    onClick={() => setActiveCat("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCat === "all"
                        ? "bg-[#190E85] text-white shadow-md shadow-[#190E85]/20"
                        : "glass-adaptive text-adaptive hover:shadow-md"
                        }`}
                >
                    All Items
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        draggable
                        onDragStart={() => setCategoryDragId(cat.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleCategoryDrop(cat.id)}
                        onClick={() => setActiveCat(cat.id)}
                        className={`group flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCat === cat.id
                            ? "bg-[#190E85] text-white shadow-md shadow-[#190E85]/20"
                            : "glass-adaptive text-adaptive hover:shadow-md"
                            }`}
                    >
                        <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                        {cat.name}
                    </button>
                ))}
                <button
                    onClick={() => setModal({ type: "category" })}
                    className="px-3 py-2 rounded-xl glass-input text-adaptive-muted hover:text-adaptive text-sm"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-adaptive-muted" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search menu..."
                        className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none glass-input"
                    />
                </div>
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-adaptive-muted">{selectedIds.length} selected</span>
                        <select
                            className="text-xs rounded-lg glass-input px-2 py-1.5 outline-none"
                            onChange={(e) => {
                                const value = e.target.value;
                                if (!value) return;
                                if (value === "active" || value === "draft" || value === "archived") {
                                    bulkUpdateMutation.mutate({ ids: selectedIds, updates: { status: value } });
                                } else if (value === "available") {
                                    bulkUpdateMutation.mutate({ ids: selectedIds, updates: { is_available: true } });
                                } else if (value === "unavailable") {
                                    bulkUpdateMutation.mutate({ ids: selectedIds, updates: { is_available: false } });
                                } else if (value.startsWith("cat:")) {
                                    bulkUpdateMutation.mutate({ ids: selectedIds, updates: { category_id: value.replace("cat:", "") } });
                                }
                                e.target.value = "";
                            }}
                        >
                            <option value="">Bulk actions</option>
                            <option value="active">Set Active</option>
                            <option value="draft">Set Draft</option>
                            <option value="archived">Set Archived</option>
                            <option value="available">Mark Available</option>
                            <option value="unavailable">Mark Unavailable</option>
                            <optgroup label="Move to category">
                                {categories.map((c) => (
                                    <option key={c.id} value={`cat:${c.id}`}>
                                        {c.name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {filteredProducts.map((product) => {
                        const modCount = product.modifiers?.length ?? 0;
                        const selected = selectedIds.includes(product.id);
                        return (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group rounded-2xl glass-adaptive p-4 space-y-3 hover:shadow-xl transition-shadow ${selected ? "ring-2 ring-[#190E85]/40" : ""}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleSelection(product.id)}
                                            className={`h-5 w-5 rounded-md flex items-center justify-center border transition-colors ${selected ? "bg-[#190E85] border-[#190E85] text-white" : "border-adaptive-muted/30"}`}
                                        >
                                            {selected && <Check className="h-3 w-3" />}
                                        </button>
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#190E85]/20 to-[#00E0FF]/20 flex items-center justify-center overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-5 w-5 text-adaptive-muted" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => duplicateProductMutation.mutate(product.id)}
                                            className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-[#190E85]"
                                            title="Duplicate"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setModal({ type: "product", data: product })}
                                            className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-[#190E85]"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                toggleAvailabilityMutation.mutate({ id: product.id, isAvailable: !product.is_available })
                                            }
                                            className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-emerald-500"
                                        >
                                            {product.is_available ? (
                                                <ToggleRight className="h-3.5 w-3.5" />
                                            ) : (
                                                <ToggleLeft className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteProductMutation.mutate(product.id)}
                                            className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-red-500"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-semibold text-adaptive">{product.name}</h3>
                                        {!product.is_available && (
                                            <IOSBadge variant="secondary" size="sm">
                                                Out of Stock
                                            </IOSBadge>
                                        )}
                                        {product.is_featured && (
                                            <IOSBadge variant="default" size="sm">
                                                Featured
                                            </IOSBadge>
                                        )}
                                        {product.status === "draft" && (
                                            <IOSBadge variant="outline" size="sm">
                                                Draft
                                            </IOSBadge>
                                        )}
                                    </div>
                                    <p className="text-xs text-adaptive-muted line-clamp-2">{product.description}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-adaptive">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-sm font-bold text-adaptive">
                                            <DollarSign className="h-3 w-3" />
                                            {Number(product.price).toFixed(2)}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-adaptive-muted">
                                            <Clock className="h-3 w-3" />
                                            {product.prep_time}m
                                        </span>
                                    </div>
                                    {modCount > 0 && (
                                        <span className="text-[10px] text-adaptive-muted bg-adaptive-surface px-2 py-1 rounded-md">
                                            {modCount} modifiers
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showQR && store && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowQR(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-3xl glass-adaptive-strong p-8 text-center space-y-4 max-w-sm w-full"
                        >
                            <h3 className="text-lg font-semibold text-adaptive">Menu QR Code</h3>
                            <div className="w-48 h-48 mx-auto rounded-2xl bg-white p-4 flex items-center justify-center">
                                <div className="text-center">
                                    <QrCode className="h-24 w-24 mx-auto text-[#190E85]" />
                                    <p className="text-[10px] text-slate-400 mt-2">Scan to view menu</p>
                                </div>
                            </div>
                            <p className="text-xs text-adaptive-muted">/{store.slug}</p>
                            <button
                                onClick={() => setShowQR(false)}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {modal?.type === "product" && (
                    <ProductModal
                        product={modal.data}
                        categories={categories}
                        storeId={storeId}
                        store={store!}
                        onClose={() => setModal(null)}
                        onSaved={() => {
                            queryClient.invalidateQueries({ queryKey: ["products", storeId] });
                            setModal(null);
                        }}
                    />
                )}
                {modal?.type === "category" && (
                    <CategoryModal
                        category={modal.data}
                        storeId={storeId}
                        onClose={() => setModal(null)}
                        onSaved={() => {
                            queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
                            setModal(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function ProductModal({
    product,
    categories,
    storeId,
    store,
    onClose,
    onSaved,
}: {
    product?: ApiProduct;
    categories: ApiCategory[];
    storeId: string;
    store: MyStore;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState({
        name: product?.name ?? "",
        slug: product?.slug ?? "",
        description: product?.description ?? "",
        price: product?.price ?? 0,
        stock: product?.stock ?? 0,
        category_id: product?.category_id ?? (categories[0]?.id || null),
        status: product?.status ?? "active",
        prep_time: product?.prep_time ?? 10,
        is_available: product?.is_available ?? true,
        is_featured: product?.is_featured ?? false,
        dietary_tags: product?.dietary_tags?.join(", ") ?? "",
        allergens: product?.allergens?.join(", ") ?? "",
    });
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                ...form,
                price: Number(form.price),
                stock: Number(form.stock),
                prep_time: Number(form.prep_time),
                dietary_tags: form.dietary_tags
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                allergens: form.allergens
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                image_url: imageUrl || null,
                category_id: form.category_id || null,
            };
            if (product?.id) {
                await api.put(`/products/${storeId}/${product.id}`, payload);
            } else {
                await api.post(`/products/${storeId}`, payload);
            }
        },
        onSuccess: () => {
            toast.success(product ? "Item updated" : "Item created");
            onSaved();
        },
        onError: () => toast.error("Failed to save item"),
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await api.post(`/products/${storeId}/upload`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setImageUrl(res.data.data.url);
            toast.success("Image uploaded");
        } catch {
            toast.error("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl rounded-3xl glass-adaptive-strong p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-adaptive">{product ? "Edit Item" : "New Menu Item"}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 md:col-span-2">
                        <input
                            placeholder="Item name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value, slug: product ? form.slug : slugify(e.target.value) })}
                            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-adaptive-muted">/{store.slug}/</span>
                            <input
                                placeholder="slug"
                                value={form.slug}
                                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                className="flex-1 rounded-xl px-4 py-2 text-xs glass-input outline-none"
                            />
                        </div>
                        <textarea
                            placeholder="Description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none min-h-[80px]"
                        />
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Price ({store.currency})</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Stock</label>
                            <input
                                type="number"
                                value={form.stock}
                                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                                className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Prep Time (min)</label>
                            <input
                                type="number"
                                value={form.prep_time}
                                onChange={(e) => setForm({ ...form, prep_time: Number(e.target.value) })}
                                className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Category</label>
                            <select
                                value={form.category_id ?? ""}
                                onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
                                className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                            >
                                <option value="">Uncategorized</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as ApiProduct["status"] })}
                                className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-1">
                            <label className="flex items-center gap-2 text-sm text-adaptive cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_available}
                                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                                    className="rounded"
                                />
                                Available
                            </label>
                            <label className="flex items-center gap-2 text-sm text-adaptive cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_featured}
                                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                                    className="rounded"
                                />
                                Featured
                            </label>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-adaptive-muted uppercase">Dietary tags (comma separated)</label>
                                <input
                                    value={form.dietary_tags}
                                    onChange={(e) => setForm({ ...form, dietary_tags: e.target.value })}
                                    placeholder="vegan, gluten-free..."
                                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-adaptive-muted uppercase">Allergens (comma separated)</label>
                                <input
                                    value={form.allergens}
                                    onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                                    placeholder="nuts, dairy..."
                                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Image</label>
                            <div className="mt-1 flex items-center gap-3">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                                ) : (
                                    <div className="h-16 w-16 rounded-xl bg-adaptive-surface flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-adaptive-muted" />
                                    </div>
                                )}
                                <label className="cursor-pointer px-3 py-2 rounded-lg glass-input text-sm text-adaptive hover:shadow">
                                    {uploading ? "Uploading..." : "Upload image"}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                                {imageUrl && (
                                    <button onClick={() => setImageUrl("")} className="text-xs text-red-500 hover:underline">
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {product ? "Save Changes" : "Create Item"}
                </button>
            </motion.div>
        </motion.div>
    );
}

function CategoryModal({
    category,
    storeId,
    onClose,
    onSaved,
}: {
    category?: ApiCategory;
    storeId: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(category?.name ?? "");
    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = { name, slug: category?.slug ?? slugify(name) };
            if (category?.id) {
                await api.patch(`/categories/${storeId}/${category.id}`, payload);
            } else {
                await api.post(`/categories/${storeId}`, payload);
            }
        },
        onSuccess: () => {
            toast.success(category ? "Category updated" : "Category created");
            onSaved();
        },
        onError: () => toast.error("Failed to save category"),
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl glass-adaptive-strong p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-adaptive">{category ? "Edit Category" : "New Category"}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <input
                    placeholder="Category name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                />
                <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !name.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium disabled:opacity-60"
                >
                    {category ? "Update Category" : "Create Category"}
                </button>
            </motion.div>
        </motion.div>
    );
}
