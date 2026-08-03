import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    UtensilsCrossed,
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
} from "lucide-react";
import { menuDb, type Product, type Category, type ModifierGroup } from "@/lib/menu-db";
import { IOSBadge } from "@/components/ui/ios-badge";

export const Route = createFileRoute("/_admin/menu")({
    component: MenuRoute,
});

function MenuRoute() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [modifiers, setModifiers] = useState<ModifierGroup[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [activeCat, setActiveCat] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState<null | { type: "product" | "category" | "modifier"; data?: any }>(null);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        setCategories(menuDb.categories.getAll());
        setProducts(menuDb.products.getAll());
        setModifiers(menuDb.modifiers.getAll());
        setLoaded(true);
    }, []);

    const refresh = () => {
        setCategories(menuDb.categories.getAll());
        setProducts(menuDb.products.getAll());
        setModifiers(menuDb.modifiers.getAll());
    };

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchCat = activeCat === "all" ? true : p.categoryId === activeCat;
            const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, activeCat, search]);

    const toggleAvailability = (id: string) => {
        const p = products.find((x) => x.id === id);
        if (p) {
            menuDb.products.update(id, { isAvailable: !p.isAvailable });
            refresh();
        }
    };

    const deleteProduct = (id: string) => {
        menuDb.products.delete(id);
        refresh();
    };

    if (!loaded)
        return (
            <div className="h-96 flex items-center justify-center text-adaptive-muted">
                Loading menu...
            </div>
        );

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
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
                        onClick={() => setActiveCat(cat.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCat === cat.id
                                ? "bg-[#190E85] text-white shadow-md shadow-[#190E85]/20"
                                : "glass-adaptive text-adaptive hover:shadow-md"
                            }`}
                    >
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

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-adaptive-muted" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search menu..."
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none glass-input"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {filteredProducts.map((product) => {
                        const modCount = product.modifiers.length;
                        return (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group rounded-2xl glass-adaptive p-4 space-y-3 hover:shadow-xl transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#190E85]/20 to-[#00E0FF]/20 flex items-center justify-center text-lg">
                                        {product.image ? "🍽️" : "🍴"}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setModal({ type: "product", data: product })}
                                            className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-[#190E85]"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => toggleAvailability(product.id)}
                                            className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-emerald-500"
                                        >
                                            {product.isAvailable ? (
                                                <ToggleRight className="h-3.5 w-3.5" />
                                            ) : (
                                                <ToggleLeft className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteProduct(product.id)}
                                            className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-red-500"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-adaptive">
                                            {product.name}
                                        </h3>
                                        {!product.isAvailable && (
                                            <IOSBadge variant="secondary" size="sm">
                                                Out of Stock
                                            </IOSBadge>
                                        )}
                                    </div>
                                    <p className="text-xs text-adaptive-muted line-clamp-2">
                                        {product.description}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-adaptive">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-sm font-bold text-adaptive">
                                            <DollarSign className="h-3 w-3" />
                                            {product.price}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-adaptive-muted">
                                            <Clock className="h-3 w-3" />
                                            {product.prepTime}m
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
                {showQR && (
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
                            <p className="text-xs text-adaptive-muted">
                                localhost:8080/shop/lumina-bistro
                            </p>
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
                        modifiers={modifiers}
                        onClose={() => setModal(null)}
                        onSave={(p) => {
                            if (modal.data?.id) menuDb.products.update(modal.data.id, p);
                            else
                                menuDb.products.add({
                                    ...p,
                                    id: Math.random().toString(36).slice(2, 8),
                                } as Product);
                            refresh();
                            setModal(null);
                        }}
                    />
                )}
                {modal?.type === "category" && (
                    <CategoryModal
                        onClose={() => setModal(null)}
                        onSave={(c) => {
                            menuDb.categories.add({
                                ...c,
                                id: Math.random().toString(36).slice(2, 8),
                                sortOrder: categories.length,
                            });
                            refresh();
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
    modifiers,
    onClose,
    onSave,
}: any) {
    const [form, setForm] = useState(
        product || {
            name: "",
            description: "",
            price: 0,
            categoryId: categories[0]?.id,
            modifiers: [],
            isAvailable: true,
            prepTime: 10,
        }
    );

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
                className="w-full max-w-lg rounded-3xl glass-adaptive-strong p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-adaptive">
                        {product ? "Edit Item" : "New Menu Item"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-3">
                    <input
                        placeholder="Item name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                    />
                    <textarea
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none min-h-[60px]"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Price</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Prep Time (min)</label>
                            <input
                                type="number"
                                value={form.prepTime}
                                onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })}
                                className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-adaptive-muted uppercase">Category</label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                className="w-full mt-1 rounded-lg px-3 py-2 text-sm glass-input outline-none"
                            >
                                {categories.map((c: Category) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">
                            Modifiers
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {modifiers.map((m: ModifierGroup) => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        const has = form.modifiers.includes(m.id);
                                        setForm({
                                            ...form,
                                            modifiers: has
                                                ? form.modifiers.filter((x: string) => x !== m.id)
                                                : [...form.modifiers, m.id],
                                        });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.modifiers.includes(m.id)
                                            ? "bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF] border border-[#190E85]/20"
                                            : "glass-input text-adaptive-muted"
                                        }`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => onSave(form)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        {product ? "Save Changes" : "Create Item"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function CategoryModal({ onClose, onSave }: any) {
    const [name, setName] = useState("");
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
                <h3 className="text-lg font-semibold text-adaptive">New Category</h3>
                <input
                    placeholder="Category name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                />
                <button
                    onClick={() => onSave({ name })}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium"
                >
                    Create Category
                </button>
            </motion.div>
        </motion.div>
    );
}