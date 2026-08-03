"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Zap,
  Cpu,
  Loader2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAIStore } from "@/lib/ai-store";
import { AIOrb } from "./ai-orb";

export function FloatingAIV3() {
  const navigate = useNavigate();
  const {
    isPanelOpen,
    togglePanel,
    closePanel,
    sessions,
    currentSessionId,
    createSession,
    setCurrentSession,
    sendMessage,
    deleteSession,
    renameSession,
    credits,
    preferredModel,
    setModel,
    isLoading,
  } = useAIStore();

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const creditPercent = Math.min(Math.round((credits.used / credits.total) * 100), 100);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, isLoading]);

  useEffect(() => {
    if (isPanelOpen && sessions.length === 0) createSession();
  }, [isPanelOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) renameSession(id, editTitle);
    setEditingId(null);
  };

  return (
    <>
      <AIOrb onClick={togglePanel} isOpen={isPanelOpen} />

      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePanel}
              className="fixed inset-0 z-40 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed z-50 bottom-24 right-6 w-[440px] max-h-[70vh] rounded-3xl border border-gray-200/60 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col glass-adaptive-strong"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-adaptive">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#190E85] to-[#CF00FF] flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-adaptive">SmartStore AI</p>
                    <p className="text-[10px] text-adaptive-muted">Powered by Gemini</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { closePanel(); navigate({ to: "/ai" }); }}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-adaptive-muted hover:text-adaptive transition-colors"
                    title="Open full page"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={closePanel}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-adaptive-muted hover:text-adaptive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Credits */}
              <div className="px-4 py-2 border-b border-adaptive bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-[#EAB308]" />
                    <span className="text-[11px] text-adaptive-muted font-medium">
                      {credits.used} / {credits.total} credits
                    </span>
                  </div>
                  <span className="text-[10px] text-adaptive-muted">Resets {credits.resetsAt}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#190E85] to-[#00E0FF]"
                    initial={{ width: 0 }}
                    animate={{ width: `${creditPercent}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Sidebar */}
                <div className="w-36 border-r border-adaptive flex flex-col bg-black/[0.01] dark:bg-white/[0.01]">
                  <div className="p-2 border-b border-adaptive">
                    <button
                      onClick={() => createSession()}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-adaptive-muted hover:text-adaptive text-[11px] font-medium transition-colors"
                    >
                      <Plus className="h-3 w-3" /> New
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                    {sessions.map((sess) => (
                      <div key={sess.id} className="group relative">
                        {editingId === sess.id ? (
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => saveRename(sess.id)}
                            onKeyDown={(e) => e.key === "Enter" && saveRename(sess.id)}
                            className="w-full px-2 py-1 text-[10px] bg-black/5 dark:bg-white/10 rounded text-adaptive outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => setCurrentSession(sess.id)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] truncate transition-colors ${currentSessionId === sess.id
                                ? "bg-black/5 dark:bg-white/10 text-adaptive font-medium"
                                : "text-adaptive-muted hover:text-adaptive hover:bg-black/3 dark:hover:bg-white/5"
                              }`}
                          >
                            {sess.title}
                          </button>
                        )}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
                          <button
                            onClick={() => startRename(sess.id, sess.title)}
                            className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-adaptive-muted hover:text-adaptive"
                          >
                            <Edit3 className="h-2.5 w-2.5" />
                          </button>
                          <button
                            onClick={() => deleteSession(sess.id)}
                            className="p-0.5 rounded hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {currentSession?.messages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === "ai"
                              ? "bg-gradient-to-br from-[#190E85] to-[#CF00FF]"
                              : "bg-black/5 dark:bg-white/10"
                            }`}
                        >
                          {msg.role === "ai" ? (
                            <Bot className="h-3 w-3 text-white" />
                          ) : (
                            <User className="h-3 w-3 text-adaptive" />
                          )}
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%] ${msg.role === "user"
                              ? "bg-[#190E85]/10 dark:bg-[#190E85]/30 text-adaptive rounded-br-md"
                              : "bg-black/5 dark:bg-white/5 text-adaptive-muted rounded-bl-md"
                            }`}
                        >
                          {msg.text}
                          {msg.model && (
                            <span className="block mt-1 text-[9px] text-adaptive-muted/50">via {msg.model}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#190E85] to-[#CF00FF] flex items-center justify-center">
                          <Loader2 className="h-3 w-3 text-white animate-spin" />
                        </div>
                        <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-black/5 dark:bg-white/5">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-adaptive-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-adaptive-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-adaptive-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-adaptive">
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setModel("gemini-2.5-flash")}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors flex items-center gap-1 ${preferredModel === "gemini-2.5-flash"
                            ? "bg-[#CF00FF]/10 text-[#CF00FF] border border-[#CF00FF]/20"
                            : "bg-black/5 dark:bg-white/5 text-adaptive-muted border border-transparent"
                          }`}
                      >
                        <Zap className="h-2.5 w-2.5" /> Flash
                      </button>
                      <button
                        onClick={() => setModel("gemini-1.5-pro")}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors flex items-center gap-1 ${preferredModel === "gemini-1.5-pro"
                            ? "bg-[#00E0FF]/10 text-[#00E0FF] border border-[#00E0FF]/20"
                            : "bg-black/5 dark:bg-white/5 text-adaptive-muted border border-transparent"
                          }`}
                      >
                        <Cpu className="h-2.5 w-2.5" /> Pro
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Ask about sales, inventory, customers..."
                        className="flex-1 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00E0FF]/30 glass-input"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}