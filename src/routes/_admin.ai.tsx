import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Send, Bot, User, Check, AlertTriangle, ShieldCheck, Play, ArrowRight, X, Cpu, DollarSign, History, Layers, TrendingUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/ai")({
  component: AIRoute,
});

interface ActionPlan {
  id: string;
  title: string;
  summary: string;
  status: "proposed" | "approved" | "completed" | "cancelled";
  created_at: string;
}

function AIRoute() {
  const queryClient = useQueryClient();
  const { data: store } = useMyStore();
  const storeId = store?.id;

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [proceedingPlan, setProceedingPlan] = useState<ActionPlan | null>(null);
  const [proceedingStep, setProceedingStep] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["ai-conversations", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/stores/me/ai/conversations`);
      return res.data.conversations || [];
    },
  });

  // Fetch Action Plans
  const { data: actionPlans = [] } = useQuery({
    queryKey: ["ai-action-plans", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/stores/me/ai/action-plans`);
      return res.data.action_plans || [];
    },
  });

  // Fetch Credits
  const { data: creditsData } = useQuery({
    queryKey: ["ai-credits", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/stores/me/ai/credits`);
      return res.data;
    },
  });

  // Fetch Messages for active conversation
  const { data: activeConvData } = useQuery({
    queryKey: ["ai-messages", activeConvId],
    enabled: !!activeConvId,
    queryFn: async () => {
      const res = await api.get(`/stores/me/ai/conversations/${activeConvId}`);
      return res.data;
    },
  });

  const messages = activeConvData?.messages || [];

  // Scroll to bottom on message updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/stores/me/ai/conversations/${activeConvId || "new"}/messages`, {
        content,
        conversation_id: activeConvId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setInput("");
      if (data.conversation_id && !activeConvId) {
        setActiveConvId(data.conversation_id);
      }
      queryClient.invalidateQueries({ queryKey: ["ai-conversations", storeId] });
      queryClient.invalidateQueries({ queryKey: ["ai-messages", activeConvId || data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ["ai-action-plans", storeId] });
      queryClient.invalidateQueries({ queryKey: ["ai-credits", storeId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to send message to AI copilot");
    },
  });

  // Proceed Action Plan Mutation
  const proceedPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await api.post(`/stores/me/ai/action-plans/${planId}/proceed`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Action Plan executed successfully!");
      setProceedingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["ai-action-plans", storeId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to proceed with Action Plan");
      setProceedingPlan(null);
    },
  });

  const handleProceed = (plan: ActionPlan) => {
    setProceedingPlan(plan);
    setProceedingStep(1);
    setTimeout(() => setProceedingStep(2), 1000);
    setTimeout(() => {
      proceedPlanMutation.mutate(plan.id);
    }, 2000);
  };

  const suggestions = [
    "Analyze today's revenue & order velocity",
    "Identify top 5 slow-moving inventory items",
    "Draft a win-back email for 30-day inactive customers",
    "Simulate impact of 10% price increase on burgers",
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Top Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> SmartStore AI Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Store-scoped AI copilot with action plan execution, credit management, and context awareness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/ai-insights">
            <IOSButton variant="outline" size="sm" className="gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Demand & Insights
            </IOSButton>
          </Link>
          <div className="px-3 py-1.5 rounded-xl bg-muted/60 text-xs font-mono flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-500" />
            <span>Credits: {creditsData?.balance?.credits_remaining ?? 1000} / 1000</span>
          </div>
          <IOSBadge variant="success" size="sm">Gemini 2.0 Flash Active</IOSBadge>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat / Interaction Console (2 Cols) */}
        <div className="lg:col-span-2 glass-card p-5 flex flex-col h-[650px]">
          {/* Messages View */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 text-xs leading-relaxed",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold",
                    msg.role === "user" ? "bg-primary" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                  )}
                >
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={cn(
                    "p-4 rounded-2xl max-w-[85%] space-y-2",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/70 text-foreground border border-border/50 rounded-tl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#CF00FF] text-white flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="glass-card p-4 text-xs leading-relaxed max-w-[85%] space-y-2">
                  <p className="font-semibold text-foreground">Welcome to SmartStore AI Studio!</p>
                  <p className="text-muted-foreground">
                    I have full live context of <strong>{store?.name || "your store"}</strong>. You can ask me to generate promotional campaigns, analyze revenue patterns, propose inventory adjustments, or execute action plans.
                  </p>
                </div>
              </div>
            )}

            {sendMessageMutation.isPending && (
              <div className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="glass-card p-3 text-xs text-muted-foreground">
                  Thinking and formulating structured response...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Prompt Input */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border/40"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessageMutation.mutate(input)}
                placeholder="Type your instruction or prompt for SmartStore AI..."
                className="flex-1 bg-muted/50 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30 border border-border/40"
              />
              <IOSButton
                variant="gradient"
                size="sm"
                onClick={() => sendMessageMutation.mutate(input)}
                isLoading={sendMessageMutation.isPending}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Send
              </IOSButton>
            </div>
          </div>
        </div>

        {/* Action Plans & History Side Panel */}
        <div className="space-y-6">
          <IOSCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Proposed Action Plans
              </h3>
              <IOSBadge variant="secondary" size="sm">{actionPlans.length}</IOSBadge>
            </div>

            {actionPlans.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                No active proposed action plans. Ask AI to generate a growth strategy to see actionable plans here.
              </div>
            ) : (
              <div className="space-y-3">
                {actionPlans.map((plan: ActionPlan) => (
                  <div key={plan.id} className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs">{plan.title}</h4>
                      <IOSBadge variant={plan.status === "approved" ? "success" : "warning"} size="sm">
                        {plan.status}
                      </IOSBadge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{plan.summary}</p>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                      <IOSButton
                        variant="gradient"
                        size="pill"
                        onClick={() => handleProceed(plan)}
                        className="gap-1 text-[11px] h-7 px-3"
                      >
                        <Play className="h-3 w-3" /> Proceed
                      </IOSButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </IOSCard>

          <IOSCard className="p-5 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Session History
            </h3>
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground">No past conversation sessions found.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {conversations.slice(0, 5).map((conv: any) => (
                  <li
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={cn(
                      "p-2 rounded-lg cursor-pointer truncate transition-colors",
                      activeConvId === conv.id ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted"
                    )}
                  >
                    {conv.title || "Untitled Session"}
                  </li>
                ))}
              </ul>
            )}
          </IOSCard>
        </div>
      </div>

      {/* Proceed Confirmation & Progress Modal */}
      {proceedingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" /> Executing Action Plan
              </h3>
              {proceedingStep === 2 && (
                <button onClick={() => setProceedingPlan(null)} className="p-1 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Executing: <strong>{proceedingPlan.title}</strong>
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", proceedingStep >= 1 ? "bg-emerald-500 text-white" : "bg-muted")}>1</div>
                <span>Validating store permissions & scope</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", proceedingStep >= 2 ? "bg-emerald-500 text-white" : "bg-muted")}>2</div>
                <span>Dispatching transactional updates to database</span>
              </div>
            </div>

            {proceedingStep < 2 ? (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-primary font-medium">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Processing saga execution...
              </div>
            ) : (
              <div className="pt-2 text-right">
                <IOSButton variant="gradient" size="sm" onClick={() => setProceedingPlan(null)}>
                  Close & Done
                </IOSButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
