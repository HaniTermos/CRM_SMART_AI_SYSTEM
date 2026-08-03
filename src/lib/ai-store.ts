import { create } from "zustand";
import { persist } from "zustand/middleware";

const USE_REAL_GEMINI = false; // ← FLIP THIS TO TRUE when you add your API key
const GEMINI_API_KEY = ""; // ← PASTE YOUR KEY HERE

export interface ChatMessage {
    id: string;
    role: "user" | "ai";
    text: string;
    timestamp: number;
    model?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}

interface AIStore {
    sessions: ChatSession[];
    currentSessionId: string | null;
    isPanelOpen: boolean;
    credits: { used: number; total: number; resetsAt: string };
    preferredModel: "gemini-2.5-flash" | "gemini-1.5-pro";
    isLoading: boolean;

    togglePanel: () => void;
    closePanel: () => void;
    createSession: () => string;
    setCurrentSession: (id: string) => void;
    addMessage: (sessionId: string, message: ChatMessage) => void;
    renameSession: (id: string, title: string) => void;
    deleteSession: (id: string) => void;
    sendMessage: (text: string) => Promise<void>;
    setModel: (model: "gemini-2.5-flash" | "gemini-1.5-pro") => void;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

const mockAIResponse = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes("order") || lower.includes("sale"))
        return "📊 Based on your recent data, orders are up 12% this week. Your top-selling item is generating 34% of revenue. Would you like me to forecast next week's demand?";
    if (lower.includes("customer") || lower.includes("guest"))
        return "👥 You have 3 VIP customers who haven't ordered in 14 days. I recommend sending them a personalized discount campaign. Shall I draft the message?";
    if (lower.includes("menu") || lower.includes("food") || lower.includes("product"))
        return "🍽️ Your menu performance shows that items with photos get 2.3x more orders. I noticed 4 items are missing images. Want me to suggest AI-generated descriptions?";
    if (lower.includes("demand") || lower.includes("forecast"))
        return "📈 I've analyzed your demand patterns. Peak hours are 7-9 PM on weekends. I suggest increasing staff during these windows. Your inventory for top 3 items will last 4 more days.";
    return "🤖 I'm your SmartStore AI powered by Gemini. I can help with sales analysis, customer segmentation, demand forecasting, menu optimization, and marketing campaigns. What would you like to explore?";
};

const callGeminiAPI = async (text: string, history: any[]): Promise<string> => {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    ...history.map((m) => ({
                        role: m.role === "user" ? "user" : "model",
                        parts: [{ text: m.text }],
                    })),
                    { role: "user", parts: [{ text }] },
                ],
            }),
        }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from Gemini.";
};

export const useAIStore = create<AIStore>()(
    persist(
        (set, get) => ({
            sessions: [],
            currentSessionId: null,
            isPanelOpen: false,
            credits: { used: 0, total: 500, resetsAt: "2026-09-01" },
            preferredModel: "gemini-2.5-flash",
            isLoading: false,

            togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
            closePanel: () => set({ isPanelOpen: false }),

            createSession: () => {
                const id = generateId();
                const newSession: ChatSession = {
                    id,
                    title: "New conversation",
                    messages: [
                        {
                            id: generateId(),
                            role: "ai",
                            text: "Hi! I'm your SmartStore AI powered by Gemini. Ask me about sales, inventory, customers, or demand forecasts.",
                            timestamp: Date.now(),
                        },
                    ],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                set((s) => ({
                    sessions: [newSession, ...s.sessions],
                    currentSessionId: id,
                }));
                return id;
            },

            setCurrentSession: (id) => set({ currentSessionId: id }),

            addMessage: (sessionId, message) => {
                set((s) => ({
                    sessions: s.sessions.map((sess) =>
                        sess.id === sessionId
                            ? {
                                ...sess,
                                messages: [...sess.messages, message],
                                updatedAt: Date.now(),
                                title:
                                    sess.title === "New conversation" && message.role === "user"
                                        ? message.text.slice(0, 28) + (message.text.length > 28 ? "..." : "")
                                        : sess.title,
                            }
                            : sess
                    ),
                    credits: {
                        ...s.credits,
                        used: s.credits.used + 1,
                    },
                }));
            },

            sendMessage: async (text: string) => {
                const { currentSessionId, addMessage, sessions, preferredModel } = get();
                if (!currentSessionId) return;

                const userMsg: ChatMessage = {
                    id: generateId(),
                    role: "user",
                    text,
                    timestamp: Date.now(),
                };
                addMessage(currentSessionId, userMsg);
                set({ isLoading: true });

                const session = sessions.find((s) => s.id === currentSessionId);
                const history = session?.messages.slice(-10) ?? [];

                try {
                    let aiText: string;
                    if (USE_REAL_GEMINI && GEMINI_API_KEY) {
                        aiText = await callGeminiAPI(text, history);
                    } else {
                        await new Promise((r) => setTimeout(r, 1200));
                        aiText = mockAIResponse(text);
                    }

                    const aiMsg: ChatMessage = {
                        id: generateId(),
                        role: "ai",
                        text: aiText,
                        timestamp: Date.now(),
                        model: preferredModel,
                    };
                    addMessage(currentSessionId, aiMsg);
                } catch (e) {
                    addMessage(currentSessionId, {
                        id: generateId(),
                        role: "ai",
                        text: "⚠️ Something went wrong. Please check your API key or try again.",
                        timestamp: Date.now(),
                    });
                } finally {
                    set({ isLoading: false });
                }
            },

            renameSession: (id, title) =>
                set((s) => ({
                    sessions: s.sessions.map((sess) =>
                        sess.id === id ? { ...sess, title } : sess
                    ),
                })),

            deleteSession: (id) =>
                set((s) => {
                    const filtered = s.sessions.filter((sess) => sess.id !== id);
                    return {
                        sessions: filtered,
                        currentSessionId:
                            s.currentSessionId === id
                                ? filtered[0]?.id ?? null
                                : s.currentSessionId,
                    };
                }),

            setModel: (model) => set({ preferredModel: model }),
        }),
        { name: "smartstore-ai-store-v2" }
    )
);