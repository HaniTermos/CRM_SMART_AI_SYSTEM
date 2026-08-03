import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  "Write 3 subject lines for a summer sale",
  "Suggest a discount strategy for inactive customers",
  "Explain what my dashboard metrics mean",
  "Help me name a new menu item",
];

export const Route = createFileRoute("/_admin/ai")({
  component: AIRoute,
});

function AIRoute() {
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([
    { role: "ai", text: "Hi! I am your SmartStore AI Copilot. I help with store operations, products, inventory, orders, customers, CRM, campaigns, discounts, reviews, reports, and demand scoring." }
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "user", text: input }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: "I am analyzing your request. For restaurant-specific insights, I can help with menu optimization, demand forecasting, and customer segmentation. What would you like to explore?" }]);
    }, 1200);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-180px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> AI Assistant
        </h1>
        <p className="text-sm text-muted-foreground">Your store-growth copilot. Ask about products, campaigns, customers, reports, and demand scoring.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "ai" ? "bg-gradient-to-br from-primary to-[#CF00FF] text-white" : "bg-muted"}`}>
              {m.role === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`glass-card p-3 max-w-[80%] text-sm leading-relaxed ${m.role === "user" ? "bg-primary/10" : ""}`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => { setInput(s); }}
              className="px-3 py-1.5 rounded-full text-xs bg-muted hover:bg-muted/80 transition-colors border border-border/40">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your store..."
            className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border/40" />
          <button onClick={send} className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}