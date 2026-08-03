import { getStorage, setStorage } from "./ssr-safe";

export interface ModifierOption {
    id: string;
    name: string;
    price: number;
}
export interface ModifierGroup {
    id: string;
    name: string;
    required: boolean;
    multiSelect: boolean;
    options: ModifierOption[];
}
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
    image?: string;
    modifiers: string[]; // group IDs
    isAvailable: boolean;
    prepTime: number; // minutes
}
export interface Category {
    id: string;
    name: string;
    sortOrder: number;
    image?: string;
}

const seedCategories = (): Category[] => [
    { id: "cat1", name: "Starters", sortOrder: 0 },
    { id: "cat2", name: "Mains", sortOrder: 1 },
    { id: "cat3", name: "Desserts", sortOrder: 2 },
    { id: "cat4", name: "Drinks", sortOrder: 3 },
];

const seedProducts = (): Product[] => [
    { id: "p1", name: "Truffle Fries", description: "Crispy fries with truffle oil", price: 8, categoryId: "cat1", modifiers: [], isAvailable: true, prepTime: 10 },
    { id: "p2", name: "Wagyu Burger", description: "Premium beef with brioche bun", price: 24, categoryId: "cat2", modifiers: ["mod1"], isAvailable: true, prepTime: 18 },
    { id: "p3", name: "Margherita", description: "Classic tomato and mozzarella", price: 16, categoryId: "cat2", modifiers: ["mod2"], isAvailable: true, prepTime: 15 },
    { id: "p4", name: "Tiramisu", description: "Italian coffee dessert", price: 12, categoryId: "cat3", modifiers: [], isAvailable: true, prepTime: 5 },
    { id: "p5", name: "Lemonade", description: "Fresh squeezed", price: 5, categoryId: "cat4", modifiers: [], isAvailable: true, prepTime: 3 },
];

const seedModifiers = (): ModifierGroup[] => [
    {
        id: "mod1", name: "Cheese", required: false, multiSelect: true, options: [
            { id: "o1", name: "Cheddar", price: 1 },
            { id: "o2", name: "Blue Cheese", price: 2 },
        ]
    },
    {
        id: "mod2", name: "Toppings", required: false, multiSelect: true, options: [
            { id: "o3", name: "Extra Cheese", price: 2 },
            { id: "o4", name: "Mushrooms", price: 1.5 },
        ]
    },
];

export const menuDb = {
    categories: {
        getAll: () => getStorage<Category[]>("ss_menu_categories", seedCategories()),
        save: (v: Category[]) => setStorage("ss_menu_categories", v),
        add: (c: Category) => { const all = menuDb.categories.getAll(); all.push(c); menuDb.categories.save(all); },
        update: (id: string, patch: Partial<Category>) => {
            const all = menuDb.categories.getAll().map((c) => (c.id === id ? { ...c, ...patch } : c));
            menuDb.categories.save(all);
        },
        delete: (id: string) => menuDb.categories.save(menuDb.categories.getAll().filter((c) => c.id !== id)),
    },
    products: {
        getAll: () => getStorage<Product[]>("ss_menu_products", seedProducts()),
        save: (v: Product[]) => setStorage("ss_menu_products", v),
        add: (p: Product) => { const all = menuDb.products.getAll(); all.push(p); menuDb.products.save(all); },
        update: (id: string, patch: Partial<Product>) => {
            const all = menuDb.products.getAll().map((p) => (p.id === id ? { ...p, ...patch } : p));
            menuDb.products.save(all);
        },
        delete: (id: string) => menuDb.products.save(menuDb.products.getAll().filter((p) => p.id !== id)),
    },
    modifiers: {
        getAll: () => getStorage<ModifierGroup[]>("ss_menu_modifiers", seedModifiers()),
        save: (v: ModifierGroup[]) => setStorage("ss_menu_modifiers", v),
        add: (m: ModifierGroup) => { const all = menuDb.modifiers.getAll(); all.push(m); menuDb.modifiers.save(all); },
        update: (id: string, patch: Partial<ModifierGroup>) => {
            const all = menuDb.modifiers.getAll().map((m) => (m.id === id ? { ...m, ...patch } : m));
            menuDb.modifiers.save(all);
        },
        delete: (id: string) => menuDb.modifiers.save(menuDb.modifiers.getAll().filter((m) => m.id !== id)),
    },
};