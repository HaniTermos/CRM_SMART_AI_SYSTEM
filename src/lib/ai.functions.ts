import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  customerId: z.string().uuid(),
});

const MODEL = "google/gemini-3-flash-preview";

const insightTool = {
  type: "function" as const,
  function: {
    name: "customer_insight",
    description: "Return a CRM insight, follow-up email draft, and product recommendations for one customer.",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "2-3 sentence behavioral summary of this customer (buying pattern, value, recency).",
        },
        next_action: {
          type: "string",
          description: "One concrete next step the store owner should take (e.g. 'call to confirm next order', 'send 10% loyalty offer').",
        },
        email_subject: { type: "string", description: "Short, friendly follow-up email subject line." },
        email_body: {
          type: "string",
          description:
            "Plain-text body of a personal follow-up email to the customer. 80-150 words, warm tone, mentions their past purchases, signs off with the store name.",
        },
        recommendations: {
          type: "array",
          description: "Up to 3 product names from the provided catalog that this customer would likely buy next.",
          items: { type: "string" },
        },
      },
      required: ["summary", "next_action", "email_subject", "email_body", "recommendations"],
      additionalProperties: false,
    },
  },
};

export const generateCustomerInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("id, store_id, name, phone, email, segment, total_orders, total_spent, last_order_at, created_at, notes")
      .eq("id", data.customerId)
      .maybeSingle();
    if (custErr) throw new Error(custErr.message);
    if (!customer) throw new Error("Customer not found");

    const [{ data: store }, { data: orders }, { data: products }] = await Promise.all([
      supabase.from("stores").select("name, currency").eq("id", customer.store_id).maybeSingle(),
      supabase
        .from("orders")
        .select("order_number, status, total, created_at, order_items(product_name, quantity, unit_price)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("products")
        .select("name, price, description")
        .eq("store_id", customer.store_id)
        .eq("status", "active")
        .limit(30),
    ]);

    const orderSummary =
      (orders ?? [])
        .map((o) => {
          const items = ((o.order_items ?? []) as Array<{ product_name: string; quantity: number; unit_price: number }>) 
            .map((i) => `${i.quantity}× ${i.product_name}`)
            .join(", ");
          return `- ${new Date(o.created_at).toISOString().slice(0, 10)} ${o.order_number} (${o.status}) ${store?.currency ?? ""} ${Number(o.total).toFixed(2)} — ${items}`;
        })
        .join("\n") || "No prior orders.";

    const catalog =
      (products ?? [])
        .map((p) => `- ${p.name} (${store?.currency ?? ""} ${Number(p.price).toFixed(2)})${p.description ? `: ${p.description.slice(0, 80)}` : ""}`)
        .join("\n") || "No active products.";

    const system = `You are an AI CRM assistant for a small e-commerce store called "${store?.name ?? "the store"}". You help the owner understand customers and follow up effectively. Be specific, warm, and practical. Cash on delivery only — never mention online payment.`;

    const userMsg = `CUSTOMER
Name: ${customer.name ?? "Unknown"}
Phone: ${customer.phone}
Segment: ${customer.segment}
Orders: ${customer.total_orders}
Lifetime spend: ${store?.currency ?? ""} ${Number(customer.total_spent).toFixed(2)}
Last order: ${customer.last_order_at ? new Date(customer.last_order_at).toISOString().slice(0, 10) : "never"}
Joined: ${new Date(customer.created_at).toISOString().slice(0, 10)}
Notes: ${customer.notes ?? "(none)"}

RECENT ORDERS
${orderSummary}

ACTIVE CATALOG (pick recommendations from here)
${catalog}

Return a CRM insight, recommended next action, a follow-up email draft, and up to 3 product recommendations.`;

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
        tools: [insightTool],
        tool_choice: { type: "function", function: { name: "customer_insight" } },
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
      summary: string;
      next_action: string;
      email_subject: string;
      email_body: string;
      recommendations: string[];
    };
    let parsed: Parsed;
    try {
      parsed = JSON.parse(argsStr) as Parsed;
    } catch {
      throw new Error("AI returned malformed JSON");
    }

    const { data: saved, error: saveErr } = await supabase
      .from("ai_insights")
      .insert({
        store_id: customer.store_id,
        customer_id: customer.id,
        kind: "customer_followup",
        summary: parsed.summary,
        next_action: parsed.next_action,
        email_subject: parsed.email_subject,
        email_body: parsed.email_body,
        recommendations: parsed.recommendations ?? [],
        model: MODEL,
      })
      .select("id, summary, next_action, email_subject, email_body, recommendations, created_at")
      .single();

    if (saveErr) throw new Error(saveErr.message);
    return saved;
  });
