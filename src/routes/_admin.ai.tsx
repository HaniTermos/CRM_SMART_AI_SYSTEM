import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Clock, Send, Zap, CircleOff, Bot, User, Loader2, ShieldCheck, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/ai")({
  component: AiPage,
});

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  model?: string;
  guarded?: boolean;
};

const EXAMPLE_PROMPTS = [
  "Write 3 subject lines for a summer sale",
  "Suggest a discount strategy for inactive customers",
  "Explain what my dashboard metrics mean",
  "Help me name a new organic skincare product",
  "How do I use the CRM pipeline for deals?",
  "What should I do with my at-risk customers?",
];

function AiPage() {
  const { data: store } = useMyStore();

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { data: status } = useQuery({
    queryKey: ["ai-status", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/ai/${store!.id}/status`);
      return res.data.data;
    },
  });

  const { data: reengagement = [] } = useQuery({
    queryKey: ["ai-reengagement", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/ai/${store!.id}/reengagement`);
      return res.data.data;
    },
  });

  const { data: recentInsights = [] } = useQuery({
    queryKey: ["ai-recent-insights", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/ai/${store!.id}/recent-insights`);
      return res.data.data;
    },
  });

  const chatMut = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post(`/ai/${store!.id}/chat`, {
        prompt: text,
        context: "general",
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.text,
          model: data.model,
          guarded: data.guarded,
        },
      ]);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.error || e?.message || "AI request failed";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${msg}` },
      ]);
    },
  });

  const sendMessage = () => {
    if (!prompt.trim()) return;
    const text = prompt.trim();
    setMessages((prev) => [...prev, { role: "user", text }]);
    setPrompt("");
    chatMut.mutate(text);
  };

  const isLive = status?.connected;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight text-adaptive">
            <Sparkles className="h-6 w-6 text-primary" /> AI Assistant
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your store-growth copilot. Ask about products, campaigns, customers, reports, and demand scoring.
          </p>
        </div>
        {status ? (
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${isLive ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            {isLive ? <Zap className="h-3 w-3" /> : <CircleOff className="h-3 w-3" />}
            {isLive ? `Gemini Live · ${status.model}` : "Fallback Mode"}
          </div>
        ) : null}
      </header>

      {/* Scope Banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium">SmartStore AI Copilot</p>
          <p className="text-muted-foreground">
            I help with store operations only — products, inventory, orders, customers, CRM, campaigns, discounts, reviews, reports, and demand scoring.
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-4 w-4 text-primary" /> Ask SmartStore AI
            </h2>
            <p className="text-xs text-muted-foreground">
              {isLive
                ? "Type any question about your store, customers, or marketing."
                : "Gemini API key not set or running in fallback mode."}
            </p>
          </div>

          <div className="flex h-96 flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Bot className="mb-3 h-10 w-10 text-primary/30" />
                  <p className="text-sm font-medium">How can I help your store today?</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    I can help you write campaigns, suggest product ideas, explain reports, review customers, improve discounts, and recommend next actions.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {EXAMPLE_PROMPTS.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => {
                          setPrompt(ex);
                        }}
                        className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <Lightbulb className="mr-1 inline h-3 w-3" />
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        {m.guarded ? <ShieldCheck className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-primary" />}
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-muted/30"}`}>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      {m.model ? (
                        <p className="mt-1 text-[10px] text-muted-foreground">{m.model}</p>
                      ) : null}
                    </div>
                    {m.role === "user" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {chatMut.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  SmartStore AI is thinking…
                </div>
              )}
            </div>

            <div className="border-t p-3">
              <div className="flex gap-2">
                <Textarea
                  rows={1}
                  className="min-h-0 resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about your store…"
                  disabled={chatMut.isPending}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!prompt.trim() || chatMut.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4" /> Re-engagement candidates
        </h2>
        <p className="text-sm text-muted-foreground">
          Customers who haven't ordered in 30+ days (or never ordered), sorted by lifetime value.
        </p>
        {reengagement.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="font-medium text-foreground">No re-engagement candidates</p>
              <p className="text-sm mt-1">All your customers have ordered recently or are marked as churned.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Segment</th>
                    <th className="p-3">Orders</th>
                    <th className="p-3">Spent</th>
                    <th className="p-3">Last order</th>
                  </tr>
                </thead>
                <tbody>
                  {reengagement.map((c: any) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-accent/40">
                      <td className="p-3">
                        <Link to="/customers/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">
                          {c.name ?? "Unnamed"}
                        </Link>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </td>
                      <td className="p-3"><Badge variant="secondary">{c.segment}</Badge></td>
                      <td className="p-3">{c.total_orders}</td>
                      <td className="p-3">{store?.currency} {Number(c.total_spent).toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground">
                        {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "Never ordered"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Recent AI insights</h2>
        {recentInsights.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No AI insights yet. Go to a customer page and click "Generate" to create one.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {recentInsights.map((i: any) => {
              const recs = Array.isArray(i.recommendations)
                ? i.recommendations.filter((r: any) => typeof r === 'string')
                : [];
              return (
                <Card key={i.id}>
                  <CardContent className="space-y-2 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/customers/$id"
                          params={{ id: i.customer_id ?? "" }}
                          className="font-medium text-primary hover:underline"
                        >
                          {i.customer_name || "Customer"}
                        </Link>
                        {recs.length > 0 && (
                          <div className="flex gap-1">
                            {recs.slice(0, 2).map((r: string) => (
                              <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(i.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p>{i.summary}</p>
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">Next action:</span> {i.next_action}</p>
                    {i.email_subject ? (
                      <p className="text-xs text-muted-foreground">Draft: "{i.email_subject}"</p>
                    ) : null}
                    {i.model ? (
                      <p className="text-[11px] text-muted-foreground">{i.model}</p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
