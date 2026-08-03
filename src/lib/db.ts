import { getStorage, setStorage } from "./ssr-safe";

export interface OrderItem {
    name: string; qty: number; price: number;
}
export interface Order {
    id: string;
    customer: string;
    phone?: string;
    items: OrderItem[];
    status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
    type: "dine-in" | "takeaway" | "delivery";
    table?: string;
    total: number;
    createdAt: string;
    note?: string;
}
export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    segment: "vip" | "active" | "new" | "dormant";
    totalSpent: number;
    orderCount: number;
    notes: string;
    tags: string[];
    lastOrder: string;
}

const seedOrders = (): Order[] => [
    { id: "#1024", customer: "Ahmad K.", phone: "+961 70 123 456", items: [{ name: "Burger", qty: 2, price: 12 }, { name: "Fries", qty: 1, price: 5 }], status: "pending", type: "dine-in", table: "Table 3", total: 29, createdAt: new Date().toISOString(), note: "Extra sauce" },
    { id: "#1023", customer: "Sarah M.", phone: "+961 71 234 567", items: [{ name: "Pizza", qty: 1, price: 18 }], status: "ready", type: "takeaway", total: 18, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "#1022", customer: "George T.", items: [{ name: "Pasta", qty: 2, price: 15 }, { name: "Salad", qty: 1, price: 8 }], status: "delivered", type: "delivery", total: 38, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: "#1021", customer: "Layla H.", phone: "+961 76 456 789", items: [{ name: "Steak", qty: 1, price: 35 }], status: "preparing", type: "dine-in", table: "Table 5", total: 35, createdAt: new Date(Date.now() - 200000000).toISOString() },
];

const seedCustomers = (): Customer[] => [
    { id: "c1", name: "Ahmad Khoury", phone: "+961 70 123 456", segment: "vip", totalSpent: 1240, orderCount: 12, notes: "Loves spicy food", tags: ["VIP", "Regular"], lastOrder: "2 days ago" },
    { id: "c2", name: "Sarah M.", phone: "+961 71 234 567", segment: "active", totalSpent: 680, orderCount: 8, notes: "", tags: ["Promo"], lastOrder: "5 days ago" },
    { id: "c3", name: "George T.", phone: "+961 3 345 678", segment: "new", totalSpent: 240, orderCount: 3, notes: "First visit last month", tags: [], lastOrder: "1 week ago" },
    { id: "c4", name: "Layla H.", phone: "+961 76 456 789", segment: "vip", totalSpent: 1890, orderCount: 15, notes: "Allergic to nuts", tags: ["VIP", "Allergies"], lastOrder: "Yesterday" },
];

export const db = {
    orders: {
        getAll: (): Order[] => getStorage("ss_orders", seedOrders()),
        save: (orders: Order[]) => setStorage("ss_orders", orders),
        add: (order: Order) => {
            const all = db.orders.getAll();
            all.unshift(order);
            db.orders.save(all);
        },
        update: (id: string, patch: Partial<Order>) => {
            const all = db.orders.getAll().map((o) => (o.id === id ? { ...o, ...patch } : o));
            db.orders.save(all);
        },
        delete: (id: string) => {
            const all = db.orders.getAll().filter((o) => o.id !== id);
            db.orders.save(all);
        },
    },
    customers: {
        getAll: (): Customer[] => getStorage("ss_customers", seedCustomers()),
        save: (customers: Customer[]) => setStorage("ss_customers", customers),
        add: (c: Customer) => {
            const all = db.customers.getAll();
            all.unshift(c);
            db.customers.save(all);
        },
        update: (id: string, patch: Partial<Customer>) => {
            const all = db.customers.getAll().map((c) => (c.id === id ? { ...c, ...patch } : c));
            db.customers.save(all);
        },
        delete: (id: string) => {
            const all = db.customers.getAll().filter((c) => c.id !== id);
            db.customers.save(all);
        },
    },
};