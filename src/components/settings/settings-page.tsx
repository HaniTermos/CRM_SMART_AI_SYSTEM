"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Palette, DollarSign, Truck, CreditCard, Users, Bell, Plug,
  Save, Upload, Moon, Sun, Printer, Trash2, X, Tag, Plus,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { getStorage, setStorage } from "@/lib/ssr-safe";

const TABS = [
  { id: "general", label: "General", icon: Store },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "currency", label: "Currency", icon: DollarSign },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { isDark, toggleDark } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-adaptive">Settings</h1>
        <p className="text-sm text-adaptive-muted">Manage your store preferences and configuration.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                    ? "bg-[#190E85]/10 dark:bg-[#190E85]/20 text-[#190E85] dark:text-[#00E0FF]"
                    : "text-adaptive-muted hover:text-adaptive hover-adaptive"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}

          <div className="mt-6 p-4 rounded-2xl glass-adaptive space-y-3">
            <p className="text-xs font-semibold text-adaptive-muted uppercase tracking-wider">Appearance</p>
            <button
              onClick={toggleDark}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-adaptive-surface text-adaptive text-sm"
            >
              <span className="flex items-center gap-2">{isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Theme</span>
              <span className="text-xs text-adaptive-muted">{isDark ? "Dark" : "Light"}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="rounded-3xl glass-adaptive p-6 space-y-6"
            >
              {activeTab === "general" && <GeneralSettings />}
              {activeTab === "branding" && <BrandingSettings />}
              {activeTab === "currency" && <CurrencySettings />}
              {activeTab === "shipping" && <ShippingSettings />}
              {activeTab === "payments" && <PaymentSettings />}
              {activeTab === "team" && <TeamSettings />}
              {activeTab === "notifications" && <NotificationSettings />}
              {activeTab === "integrations" && <IntegrationSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function useStoredState<T>(key: string, fallback: T): [T, (v: T | ((p: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(fallback);
  useEffect(() => {
    const saved = getStorage(key, fallback);
    setState(saved);
  }, [key]);
  const save = () => setStorage(key, state);
  return [state, setState, save];
}

/* ─── General ─── */
function GeneralSettings() {
  const [form, setForm, save] = useStoredState("ss_settings_general", {
    name: "Lumina Bistro", slug: "lumina-bistro", timezone: "UTC+3", phone: "", email: ""
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-adaptive">General</h3>
      <div className="grid gap-4">
        {[
          { key: "name", label: "Store Name", type: "text" },
          { key: "slug", label: "Store URL Slug", type: "text" },
          { key: "phone", label: "Phone Number", type: "tel" },
          { key: "email", label: "Email", type: "email" },
        ].map((field) => (
          <div key={field.key}>
            <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">{field.label}</label>
            <input
              type={field.type}
              value={(form as any)[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none focus:ring-2 focus:ring-[#190E85]/20"
            />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">Timezone</label>
          <select
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
          >
            {["UTC+0", "UTC+1", "UTC+2", "UTC+3", "UTC+4"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={save}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </div>
  );
}

/* ─── Branding ─── */
function BrandingSettings() {
  const [color, setColor] = useState("#190E85");
  useEffect(() => { setColor(getStorage("ss_brand_color", "#190E85")); }, []);
  const save = () => setStorage("ss_brand_color", color);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-adaptive">Branding</h3>
      <div>
        <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">Primary Color</label>
        <div className="flex gap-3 items-center">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-10 rounded-lg border-0 p-0 cursor-pointer" />
          <input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 rounded-xl px-4 py-2.5 text-sm glass-input outline-none font-mono" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">Logo</label>
        <div className="border-2 border-dashed border-adaptive rounded-2xl p-8 flex flex-col items-center gap-2 text-adaptive-muted hover:text-adaptive hover:border-[#190E85]/50 transition-colors cursor-pointer">
          <Upload className="h-6 w-6" />
          <span className="text-sm">Click to upload logo</span>
        </div>
      </div>
      <button onClick={save} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        <Save className="h-4 w-4" /> Save Branding
      </button>
    </div>
  );
}

/* ─── Currency ─── */
function CurrencySettings() {
  const [form, setForm, save] = useStoredState("ss_settings_currency", {
    symbol: "$", code: "USD", taxRate: 11, format: "symbol_first"
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-adaptive">Currency & Tax</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">Symbol</label>
          <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none text-center font-mono text-lg" />
        </div>
        <div>
          <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">Code</label>
          <select value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none">
            {["USD", "EUR", "GBP", "LBP", "AED", "SAR"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">Tax Rate (%)</label>
        <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
      </div>
      <div>
        <label className="text-xs font-medium text-adaptive-muted mb-1.5 block">Format</label>
        <div className="flex gap-3">
          {["symbol_first", "code_first"].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setForm({ ...form, format: fmt })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${form.format === fmt
                  ? "bg-[#190E85]/10 border-[#190E85]/30 text-[#190E85] dark:text-[#00E0FF]"
                  : "glass-input border-transparent text-adaptive-muted"
                }`}
            >
              {fmt === "symbol_first" ? "$ 12.00" : "USD 12.00"}
            </button>
          ))}
        </div>
      </div>
      <button onClick={save} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        <Save className="h-4 w-4" /> Save Currency
      </button>
    </div>
  );
}

/* ─── Shipping ─── */
function ShippingSettings() {
  const [zones, setZones] = useState<any[]>([]);
  useEffect(() => {
    setZones(getStorage("ss_settings_shipping", [
      { id: "1", name: "Local Delivery", fee: 2, minOrder: 10, radius: 5, active: true },
      { id: "2", name: "Outside City", fee: 5, minOrder: 20, radius: 15, active: false },
    ]));
  }, []);
  const save = () => setStorage("ss_settings_shipping", zones);

  const updateZone = (id: string, patch: any) => setZones(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  const addZone = () => setZones([...zones, { id: Math.random().toString(36).slice(2, 6), name: "New Zone", fee: 0, minOrder: 0, radius: 0, active: true }]);
  const removeZone = (id: string) => setZones(zones.filter((z) => z.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-adaptive">Delivery Zones</h3>
        <button onClick={addZone} className="px-3 py-1.5 rounded-lg bg-adaptive-surface text-adaptive text-xs font-medium hover-adaptive transition-colors">+ Add Zone</button>
      </div>
      <div className="space-y-3">
        {zones.map((zone) => (
          <div key={zone.id} className="p-4 rounded-2xl glass-input space-y-3">
            <div className="flex items-center justify-between">
              <input value={zone.name} onChange={(e) => updateZone(zone.id, { name: e.target.value })} className="bg-transparent text-sm font-medium text-adaptive outline-none" />
              <div className="flex items-center gap-2">
                <button onClick={() => updateZone(zone.id, { active: !zone.active })} className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${zone.active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>{zone.active ? "Active" : "Off"}</button>
                <button onClick={() => removeZone(zone.id)} className="p-1 rounded hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "fee", label: "Fee" },
                { key: "minOrder", label: "Min Order" },
                { key: "radius", label: "Radius (km)" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] text-adaptive-muted uppercase">{f.label}</label>
                  <input type="number" value={zone[f.key]} onChange={(e) => updateZone(zone.id, { [f.key]: Number(e.target.value) })} className="w-full mt-1 rounded-lg px-3 py-1.5 text-sm bg-adaptive-surface text-adaptive outline-none" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        <Save className="h-4 w-4" /> Save Shipping
      </button>
    </div>
  );
}

/* ─── Payments ─── */
function PaymentSettings() {
  const [methods, setMethods] = useState<any>({});
  useEffect(() => {
    setMethods(getStorage("ss_settings_payments", {
      cash: { active: true, label: "Cash on Delivery" },
      card: { active: true, label: "Credit Card" },
      online: { active: false, label: "Online Payment" },
      stripeKey: "",
    }));
  }, []);
  const save = () => setStorage("ss_settings_payments", methods);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-adaptive">Payment Methods</h3>
      <div className="space-y-3">
        {(["cash", "card", "online"] as const).map((key) => (
          <div key={key} className="flex items-center justify-between p-4 rounded-2xl glass-input">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${methods[key]?.active ? "bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF]" : "bg-adaptive-surface text-adaptive-muted"}`}>
                {key === "cash" ? <DollarSign className="h-5 w-5" /> : key === "card" ? <CreditCard className="h-5 w-5" /> : <Plug className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-adaptive">{methods[key]?.label}</p>
                <p className="text-[11px] text-adaptive-muted">{methods[key]?.active ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            <button
              onClick={() => setMethods({ ...methods, [key]: { ...methods[key], active: !methods[key]?.active } })}
              className={`relative w-11 h-6 rounded-full transition-colors ${methods[key]?.active ? "bg-[#190E85]" : "bg-black/10 dark:bg-white/10"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${methods[key]?.active ? "translate-x-5" : ""}`} />
            </button>
          </div>
        ))}
      </div>
      {methods.online?.active && (
        <div className="p-4 rounded-2xl glass-input space-y-2">
          <label className="text-xs font-medium text-adaptive-muted">Stripe Publishable Key</label>
          <input type="password" value={methods.stripeKey || ""} onChange={(e) => setMethods({ ...methods, stripeKey: e.target.value })} placeholder="pk_live_..." className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none font-mono text-xs" />
        </div>
      )}
      <button onClick={save} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        <Save className="h-4 w-4" /> Save Payments
      </button>
    </div>
  );
}

/* ─── Team ─── */
function TeamSettings() {
  const [members, setMembers] = useState<any[]>([]);
  useEffect(() => {
    setMembers(getStorage("ss_settings_team", [
      { id: "1", name: "You", email: "owner@store.com", role: "Owner", active: true },
      { id: "2", name: "Manager", email: "manager@store.com", role: "Manager", active: true },
    ]));
  }, []);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Staff");
  const save = () => setStorage("ss_settings_team", members);

  const invite = () => {
    if (!inviteEmail.trim()) return;
    setMembers([...members, { id: Math.random().toString(36).slice(2, 8), name: inviteEmail.split("@")[0], email: inviteEmail, role: inviteRole, active: true }]);
    setInviteEmail("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-adaptive">Team Members</h3>
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl glass-input">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#190E85] to-[#CF00FF] flex items-center justify-center text-white text-xs font-bold">{m.name[0]}</div>
              <div>
                <p className="text-sm font-medium text-adaptive">{m.name}</p>
                <p className="text-[11px] text-adaptive-muted">{m.email} · {m.role}</p>
              </div>
            </div>
            {m.role !== "Owner" && (
              <button onClick={() => setMembers(members.filter((x) => x.id !== m.id))} className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 rounded-2xl glass-input space-y-3">
        <p className="text-xs font-semibold text-adaptive-muted uppercase tracking-wider">Invite Member</p>
        <div className="flex gap-2">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" className="flex-1 rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="rounded-xl px-3 py-2.5 text-sm glass-input outline-none">
            <option>Staff</option>
            <option>Manager</option>
          </select>
        </div>
        <button onClick={invite} className="w-full py-2 rounded-xl bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF] text-sm font-medium hover:bg-[#190E85]/20 transition-colors">Send Invite</button>
      </div>
      <button onClick={save} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        <Save className="h-4 w-4" /> Save Team
      </button>
    </div>
  );
}

/* ─── Notifications ─── */
function NotificationSettings() {
  const [prefs, setPrefs] = useState<any>({});
  useEffect(() => {
    setPrefs(getStorage("ss_settings_notifications", {
      emailNewOrder: true, emailDailyReport: true, smsLowStock: false, pushChurnAlert: true, webhookUrl: ""
    }));
  }, []);
  const save = () => setStorage("ss_settings_notifications", prefs);

  const Toggle = ({ label, desc, k }: { label: string; desc: string; k: string }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl glass-input">
      <div>
        <p className="text-sm font-medium text-adaptive">{label}</p>
        <p className="text-[11px] text-adaptive-muted">{desc}</p>
      </div>
      <button
        onClick={() => setPrefs({ ...prefs, [k]: !prefs[k] })}
        className={`relative w-11 h-6 rounded-full transition-colors ${prefs[k] ? "bg-[#190E85]" : "bg-black/10 dark:bg-white/10"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs[k] ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-adaptive">Notifications</h3>
      <div className="space-y-2">
        <Toggle label="New Order Emails" desc="Receive an email for every new order" k="emailNewOrder" />
        <Toggle label="Daily Report" desc="Get a sales summary every morning" k="emailDailyReport" />
        <Toggle label="Low Stock SMS" desc="Text alert when inventory is running low" k="smsLowStock" />
        <Toggle label="Churn Alerts" desc="Push notification when a VIP customer goes quiet" k="pushChurnAlert" />
      </div>
      <div className="p-4 rounded-2xl glass-input space-y-2">
        <label className="text-xs font-medium text-adaptive-muted">Webhook URL (Optional)</label>
        <input value={prefs.webhookUrl || ""} onChange={(e) => setPrefs({ ...prefs, webhookUrl: e.target.value })} placeholder="https://your-app.com/webhook" className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none font-mono text-xs" />
      </div>
      <button onClick={save} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        <Save className="h-4 w-4" /> Save Preferences
      </button>
    </div>
  );
}

/* ─── Integrations ─── */
function IntegrationSettings() {
  const [configs, setConfigs] = useState<any>({});
  useEffect(() => {
    setConfigs(getStorage("ss_settings_integrations", {
      whatsapp: { active: false, number: "" },
      googleMaps: { active: false, apiKey: "" },
      printNode: { active: false, apiKey: "" },
    }));
  }, []);
  const save = () => setStorage("ss_settings_integrations", configs);

  const Card = ({ name, icon: Icon, keyName, fields }: { name: string; icon: any; keyName: string; fields: { key: string; label: string }[] }) => {
    const active = configs[keyName]?.active;
    return (
      <div className={`p-4 rounded-2xl border transition-all ${active ? "border-[#190E85]/30 bg-[#190E85]/5" : "glass-input border-transparent"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF]" : "bg-adaptive-surface text-adaptive-muted"}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-adaptive">{name}</p>
              <p className="text-[11px] text-adaptive-muted">{active ? "Connected" : "Not connected"}</p>
            </div>
          </div>
          <button
            onClick={() => setConfigs({ ...configs, [keyName]: { ...configs[keyName], active: !active } })}
            className={`relative w-11 h-6 rounded-full transition-colors ${active ? "bg-[#190E85]" : "bg-black/10 dark:bg-white/10"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {active && (
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-[10px] text-adaptive-muted uppercase">{f.label}</label>
                <input
                  value={configs[keyName]?.[f.key] || ""}
                  onChange={(e) => setConfigs({ ...configs, [keyName]: { ...configs[keyName], [f.key]: e.target.value } })}
                  className="w-full mt-1 rounded-lg px-3 py-2 text-sm bg-adaptive-surface text-adaptive outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-adaptive">Integrations</h3>
      <div className="space-y-3">
        <Card name="WhatsApp Business" icon={Bell} keyName="whatsapp" fields={[{ key: "number", label: "Business Number" }]} />
        <Card name="Google Maps" icon={Truck} keyName="googleMaps" fields={[{ key: "apiKey", label: "API Key" }]} />
        <Card name="Print Node" icon={Printer} keyName="printNode" fields={[{ key: "apiKey", label: "API Key" }]} />
      </div>
      <button onClick={save} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        <Save className="h-4 w-4" /> Save Integrations
      </button>
    </div>
  );
}