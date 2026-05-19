import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  storeId: z.string().uuid(),
  idea: z.string().min(3).max(500),
  targetPrice: z.number().min(0).max(1_000_000).optional(),
});

const MODEL = "google/gemini-3-flash-preview";

const scoreTool = {
  type: "function" as const,
  function: {
    name: "demand_score",
    description: "Score a proposed new product idea against the store's catalog and recent buyers.",
    parameters: {
      type: "object",
      properties: {
        score: { type: "number", description: "Demand score from 0-100." },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        rationale: { type: "string", description: "2-4 sentence explanation referencing concrete catalog / buyer signals." },
        target_segments: {
          type: "array",
          description: "Existing customer segments most likely to buy (e.g. vip, active).",
          items: { type: "string" },
        },
        suggested_price: { type: "number", description: "Recommended price in the store's currency." },
        risks: {
          type: "array",
          description: "Up to 3 risks or reasons demand could be weaker than expected.",
          items: { type: "string" },
        },
        positioning: { type: "string", description: "One-line positioning statement to use in product copy." },
      },
      required: ["score", "confidence", "rationale", "target_segments", "suggested_price", "risks", "positioning"],
      additionalProperties: false,
    },
  },
};

export const scoreProductIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("id, name, currency")
      .eq("id", data.storeId)
      .maybeSingle();
    if (storeErr) throw new Error(storeErr.message);
    if (!store) throw new Error("Store not found");

    const sinceIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: products }, { data: recentOrders }, { data: segCounts }] = await Promise.all([
      supabase
        .from("products")
        .select("name, price, status, stock, description")
        .eq("store_id", store.id)
        .limit(50),
      supabase
        .from("orders")
        .select("total, created_at, order_items(product_name, quantity, unit_price)")
        .eq("store_id", store.id)
        .gte("created_at", sinceIso)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("customers")
        .select("segment")
        .eq("store_id", store.id),
    ]);

    // Aggregate top selling items in last 90 days
    const tally = new Map<string, { qty: number; revenue: number }>();
    for (const o of recentOrders ?? []) {
      const items = (o.order_items ?? []) as Array<{ product_name: string; quantity: number; unit_price: number }>;
      for (const it of items) {
        const cur = tally.get(it.product_name) ?? { qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.quantity * Number(it.unit_price);
        tally.set(it.product_name, cur);
      }
    }
    const topSelling = [...tally.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([n, v]) => `- ${n}: ${v.qty} sold, ${store.currency} ${v.revenue.toFixed(2)}`)
      .join("\n") || "No recent sales.";

    const segments = new Map<string, number>();
    for (const c of segCounts ?? []) segments.set(c.segment, (segments.get(c.segment) ?? 0) + 1);
    const segmentLine = [...segments.entries()].map(([s, n]) => `${s}:${n}`).join(", ") || "no customers yet";

    const catalog = (products ?? [])
      .map((p) => `- ${p.name} (${p.status}, ${store.currency} ${Number(p.price).toFixed(2)}, stock ${p.stock})`)
      .join("\n") || "Empty catalog.";

    const system = `You evaluate new product ideas for a small e-commerce store called "${store.name}". Be pragmatic — base your score on overlap with current catalog, fit with recent buyer behavior, pricing, and stock signals. Cash on delivery only.`;

    const userMsg = `IDEA
${data.idea}
${data.targetPrice != null ? `Target price: ${store.currency} ${data.targetPrice.toFixed(2)}` : "Target price: (not specified)"}

CURRENT CATALOG
${catalog}

TOP SELLERS (last 90 days)
${topSelling}

CUSTOMER SEGMENTS
${segmentLine}

Score this idea 0-100, explain why, suggest a price in ${store.currency}, name target segments, list risks, and write a one-line positioning statement.`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        tools: [scoreTool],
        tool_choice: { type: "function", function: { name: "demand_score" } },
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit hit. Please try again in a minute.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error(`AI gateway error (${res.status})`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const argsStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) throw new Error("AI returned no structured result");

    type Parsed = {
      score: number;
      confidence: "low" | "medium" | "high";
      rationale: string;
      target_segments: string[];
      suggested_price: number;
      risks: string[];
      positioning: string;
    };
    let parsed: Parsed;
    try {
      parsed = JSON.parse(argsStr) as Parsed;
    } catch {
      throw new Error("AI returned malformed JSON");
    }

    const summary = `Demand score ${Math.round(parsed.score)}/100 (${parsed.confidence}). ${parsed.rationale}`;

    const { data: saved, error: saveErr } = await supabase
      .from("ai_insights")
      .insert({
        store_id: store.id,
        customer_id: null,
        kind: "product_demand",
        summary,
        next_action: parsed.positioning,
        email_subject: data.idea.slice(0, 120),
        email_body: null,
        recommendations: {
          score: parsed.score,
          confidence: parsed.confidence,
          target_segments: parsed.target_segments,
          suggested_price: parsed.suggested_price,
          risks: parsed.risks,
          positioning: parsed.positioning,
          idea: data.idea,
          target_price: data.targetPrice ?? null,
        },
        model: MODEL,
      })
      .select("id, summary, next_action, email_subject, recommendations, created_at")
      .single();

    if (saveErr) throw new Error(saveErr.message);
    return { saved, parsed };
  });
