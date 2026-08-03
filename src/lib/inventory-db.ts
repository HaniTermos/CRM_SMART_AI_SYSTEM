import { getStorage, setStorage } from "./ssr-safe";

export interface Supplier {
    id: string;
    name: string;
    phone: string;
    email: string;
    leadTime: number; // days
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
    unitCost: number;
    supplierId?: string;
    lastRestocked: string;
    expiryDate?: string;
    location: string;
}

const seedSuppliers = (): Supplier[] => [
    { id: "s1", name: "Fresh Farms Co.", phone: "+961 1 234 567", email: "orders@freshfarms.com", leadTime: 2 },
    { id: "s2", name: "Global Meats Ltd.", phone: "+961 1 987 654", email: "sales@globalmeats.com", leadTime: 3 },
    { id: "s3", name: "Beverage Bros", phone: "+961 1 456 789", email: "supply@bevbros.com", leadTime: 1 },
];

const seedInventory = (): InventoryItem[] => [
    { id: "i1", name: "Beef Patty (150g)", category: "Proteins", unit: "pcs", currentStock: 120, minStock: 50, maxStock: 200, reorderPoint: 60, unitCost: 1.2, supplierId: "s2", lastRestocked: "2026-08-01", location: "Walk-in Fridge" },
    { id: "i2", name: "Brioche Bun", category: "Bakery", unit: "pcs", currentStock: 80, minStock: 40, maxStock: 150, reorderPoint: 50, unitCost: 0.4, supplierId: "s1", lastRestocked: "2026-08-02", location: "Dry Storage" },
    { id: "i3", name: "Mozzarella", category: "Dairy", unit: "kg", currentStock: 12, minStock: 10, maxStock: 30, reorderPoint: 15, unitCost: 8.5, supplierId: "s1", lastRestocked: "2026-07-30", expiryDate: "2026-08-15", location: "Walk-in Fridge" },
    { id: "i4", name: "Tomato Sauce", category: "Sauces", unit: "L", currentStock: 25, minStock: 10, maxStock: 40, reorderPoint: 12, unitCost: 3.2, supplierId: "s1", lastRestocked: "2026-08-01", location: "Dry Storage" },
    { id: "i5", name: "Truffle Oil", category: "Oils", unit: "bottle", currentStock: 6, minStock: 4, maxStock: 15, reorderPoint: 5, unitCost: 24.0, supplierId: "s2", lastRestocked: "2026-07-25", location: "Dry Storage" },
    { id: "i6", name: "Craft Cola", category: "Beverages", unit: "can", currentStock: 200, minStock: 100, maxStock: 400, reorderPoint: 120, unitCost: 0.8, supplierId: "s3", lastRestocked: "2026-08-02", location: "Cold Room" },
    { id: "i7", name: "Arborio Rice", category: "Grains", unit: "kg", currentStock: 18, minStock: 10, maxStock: 50, reorderPoint: 15, unitCost: 4.5, supplierId: "s1", lastRestocked: "2026-07-28", location: "Dry Storage" },
    { id: "i8", name: "Salmon Fillet", category: "Proteins", unit: "kg", currentStock: 4, minStock: 5, maxStock: 20, reorderPoint: 6, unitCost: 18.0, supplierId: "s2", lastRestocked: "2026-08-01", expiryDate: "2026-08-05", location: "Walk-in Fridge" },
];

export const inventoryDb = {
    items: {
        getAll: () => getStorage<InventoryItem[]>("ss_inventory", seedInventory()),
        save: (v: InventoryItem[]) => setStorage("ss_inventory", v),
        add: (item: InventoryItem) => {
            const all = inventoryDb.items.getAll();
            all.unshift(item);
            inventoryDb.items.save(all);
        },
        update: (id: string, patch: Partial<InventoryItem>) => {
            const all = inventoryDb.items.getAll().map((i) => (i.id === id ? { ...i, ...patch } : i));
            inventoryDb.items.save(all);
        },
        delete: (id: string) => inventoryDb.items.save(inventoryDb.items.getAll().filter((i) => i.id !== id)),
    },
    suppliers: {
        getAll: () => getStorage<Supplier[]>("ss_suppliers", seedSuppliers()),
        save: (v: Supplier[]) => setStorage("ss_suppliers", v),
        add: (s: Supplier) => {
            const all = inventoryDb.suppliers.getAll();
            all.unshift(s);
            inventoryDb.suppliers.save(all);
        },
        update: (id: string, patch: Partial<Supplier>) => {
            const all = inventoryDb.suppliers.getAll().map((s) => (s.id === id ? { ...s, ...patch } : s));
            inventoryDb.suppliers.save(all);
        },
        delete: (id: string) => inventoryDb.suppliers.save(inventoryDb.suppliers.getAll().filter((s) => s.id !== id)),
    },
};