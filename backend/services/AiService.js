const { GoogleGenAI } = require('@google/genai');

// Initialize the SDK. It reads GOOGLE_API_KEY from env automatically,
// but we pass it explicitly for clarity.
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

class AiService {
  static async generateInsight(store, customer, orders) {
    const model = DEFAULT_MODEL;
    const apiKey = process.env.GOOGLE_API_KEY;

    const ordersContext = orders.map(o =>
      `- Order #${o.order_number}: $${o.total}, status: ${o.status}, date: ${new Date(o.created_at).toLocaleDateString()}`
    ).join('\n');

    // If API key exists, call Gemini for a real insight
    if (apiKey) {
      try {
        const prompt = `You are an expert e-commerce CRM analyst.

Store: ${store.name}
Customer: ${customer.name} (${customer.email || 'no email'})
Phone: ${customer.phone}
Total spent: $${customer.total_spent}
Total orders: ${customer.total_orders}
Segment: ${customer.segment || 'unknown'}
Last order: ${customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString() : 'never'}

Recent orders:
${ordersContext || 'No orders on record.'}

Generate a JSON object with exactly these fields:
- summary (string): a brief behavioral analysis of this customer
- next_action (string): one concrete next step the store owner should take
- email_subject (string): a catchy subject line for a follow-up email
- email_body (string): a short, personalized email body (2-4 sentences)
- recommendations (array of strings): 2-3 short recommendation tags (e.g. ["10% Discount", "Upsell New Arrivals"])

Output ONLY valid JSON.`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const text = response.text || '{}';
        const aiData = JSON.parse(text);

        return {
          kind: 'customer_analysis',
          summary: aiData.summary || `Customer ${customer.name} has placed ${orders.length} orders totaling $${customer.total_spent}.`,
          next_action: aiData.next_action || 'Send a personalized follow-up email.',
          email_subject: aiData.email_subject || `Special Offer Just For You, ${customer.name}!`,
          email_body: aiData.email_body || `Hi ${customer.name},\n\nWe noticed you haven't shopped with us in a while. Here's a 10% discount code (WELCOME10) to use on your next purchase!\n\nThanks,\n${store.name} Team`,
          recommendations: Array.isArray(aiData.recommendations)
            ? aiData.recommendations.filter((r) => typeof r === 'string')
            : ['10% Discount', 'Upsell New Arrivals'],
          model: `gemini/${model}`
        };
      } catch (err) {
        console.error('[AI] Gemini insight request failed, falling back to static', err);
      }
    }

    // Static fallback when no key or request failed
    return {
      kind: 'customer_analysis',
      summary: `Customer ${customer.name} has placed ${orders.length} orders totaling $${customer.total_spent}. They prefer COD.`,
      next_action: `Send a personalized re-engagement email with a 10% discount on their favorite category.`,
      email_subject: `Special Offer Just For You, ${customer.name}!`,
      email_body: `Hi ${customer.name},\n\nWe noticed you haven't shopped with us in a while. Here is a 10% discount code (WELCOME10) to use on your next purchase!\n\nThanks,\n${store.name} Team`,
      recommendations: ['10% Discount', 'Upsell New Arrivals'],
      model: `gemini/${model} (Static Fallback)`
    };
  }

  static async scoreDemand(store, idea, targetPrice) {
    const model = DEFAULT_MODEL;
    const apiKey = process.env.GOOGLE_API_KEY;
    const suggestedPrice = targetPrice || 19.99;

    // --- Heuristic Baseline ---
    const db = require('../config/database');

    const keyword = idea.split(' ')[0] || idea;
    let baseScore = 65;
    let velocityData = { avg_units: 0 };

    try {
      const similar = await db.query(
        `SELECT avg(total_units) as avg_units
         FROM (
           SELECT SUM(oi.quantity) as total_units
           FROM products p
           JOIN order_items oi ON oi.product_id = p.id
           JOIN orders o ON o.id = oi.order_id
           WHERE p.store_id = $1 AND p.name ILIKE $2
           GROUP BY p.id
         ) t`,
        [store.id, `%${keyword}%`]
      );

      const avgUnits = Number(similar.rows[0]?.avg_units || 0);
      velocityData.avg_units = avgUnits;

      if (avgUnits > 0) {
        baseScore += Math.min(30, Math.round((avgUnits / 5) * 5));
      }
    } catch (dbErr) {
      console.error('[AI] Heuristic DB query failed:', dbErr);
    }

    // If API key is provided, call Gemini for a real analysis
    if (apiKey) {
      try {
        const prompt = `You are an expert e-commerce demand analyst.

Store Name: ${store.name}
Product Idea: ${idea}
Target Price: $${suggestedPrice}
Historical Velocity for similar items: ${velocityData.avg_units} units.

Analyze the market demand and output ONLY a valid JSON object with exactly these fields:
- score (integer 0-100)
- summary (string)
- next_action (string)
- confidence (string: High, Medium, or Low)
- positioning (string): one sentence on how to market this product
- target_segments (array of strings): 2-3 customer types who would buy this
- risks (array of strings): 2-3 potential risks or barriers to entry

Output ONLY valid JSON.`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const text = response.text || '{}';
        const aiData = JSON.parse(text);

        return {
          kind: 'product_demand',
          summary: aiData.summary || `Analysis completed for ${idea}.`,
          next_action: aiData.next_action || 'Review and proceed.',
          email_subject: idea.substring(0, 50),
          email_body: '',
          recommendations: {
            score: typeof aiData.score === 'number' ? aiData.score : baseScore,
            suggested_price: suggestedPrice,
            confidence: aiData.confidence || 'Medium',
            positioning: aiData.positioning || null,
            target_segments: Array.isArray(aiData.target_segments) ? aiData.target_segments : [],
            risks: Array.isArray(aiData.risks) ? aiData.risks : []
          },
          model: `gemini/${model} (Live + Heuristic)`
        };
      } catch (err) {
        console.error('[AI] Gemini demand request failed, falling back to heuristic only', err);
      }
    }

    return {
      kind: 'product_demand',
      summary: `Based on your store's historical data, items similar to "${idea}" have an average sales velocity of ${velocityData.avg_units} units.`,
      next_action: baseScore > 80 ? `Launch immediately with full stock.` : `Test with a small batch of 20 units.`,
      email_subject: idea.substring(0, 50),
      email_body: '',
      recommendations: {
        score: baseScore,
        suggested_price: suggestedPrice,
        confidence: baseScore > 80 ? 'High' : (baseScore > 65 ? 'Medium' : 'Low'),
        positioning: "Focus core marketing heavily on local demand histories.",
        target_segments: ["Existing Store Shoppers"],
        risks: ["Limited live external market context in offline mode."]
      },
      model: `Heuristic DB Analysis (No API Key)`
    };
  }

  static isInScope(query) {
    const lower = query.toLowerCase();

    // In-scope keywords for SmartStore AI
    const inScope = [
      'product', 'products', 'inventory', 'stock', 'category', 'categories',
      'order', 'orders', 'customer', 'customers', 'crm', 'pipeline', 'deal', 'deals',
      'campaign', 'campaigns', 'email', 'emails', 'discount', 'discounts', 'coupon',
      'review', 'reviews', 'report', 'reports', 'revenue', 'sales', 'demand', 'scoring',
      'dashboard', 'metric', 'metrics', 'kpi', 'insight', 'insights',
      'store', 'shop', 'merchant', 'business', 'marketing', 'sale', 'promotion',
      'segment', 'segmentation', 'vip', 'active', 'churned', 'at_risk',
      'subject line', 'subject lines', 'email body', 'preview text', 'ab test',
      'price', 'pricing', 'shipping', 'settings', 'tax', 'currency',
      'help', 'how to', 'how do i', 'what is', 'explain', 'suggest', 'recommend',
      'write', 'draft', 'generate', 'create', 'analyze', 'analysis',
      'hello', 'hi', 'hey', 'thanks', 'thank you', 'ok', 'okay',
    ];

    const outOfScope = [
      'quantum', 'physics', 'chemistry', 'biology', 'math', 'calculus', 'algebra',
      'homework', 'essay', 'school', 'university', 'exam', 'test', 'grade',
      'code', 'coding', 'programming', 'javascript', 'python', 'react', 'api',
      'travel', 'flight', 'hotel', 'vacation', 'trip', 'booking',
      'recipe', 'cooking', 'food', 'restaurant',
      'movie', 'music', 'sport', 'game', 'gaming', 'politics', 'news',
      'medical', 'health', 'doctor', 'diagnosis', 'therapy',
      'legal', 'lawyer', 'court', 'contract',
    ];

    const hasInScope = inScope.some((k) => lower.includes(k));
    const hasOutOfScope = outOfScope.some((k) => lower.includes(k));

    // If explicitly out-of-topic keywords are present and no in-scope ones, reject
    if (hasOutOfScope && !hasInScope) return false;

    // Default: allow (Gemini + system prompt will handle edge cases)
    return true;
  }

  static buildSystemPrompt(context) {
    const base = `You are SmartStore AI, an embedded commerce assistant inside the SmartStore AI platform.

Your job is to help merchants use SmartStore AI effectively. You are ONLY allowed to answer questions related to the store and its workflows.

Allowed topics:
- Dashboard metrics and KPIs
- Products, categories, and inventory
- Orders and order tracking
- Customers, segments, and CRM pipeline
- Reviews and ratings
- Discounts and coupons
- Email campaigns and subject lines
- AI insights and demand scoring
- Reports and store settings

Rules:
- Stay inside the SmartStore AI domain at all times.
- Never present yourself as a general assistant for coding, essays, homework, travel, or unrelated life advice.
- If the user asks an unrelated question, politely say you are focused on store operations and marketing inside SmartStore AI.
- Prefer short, practical, action-oriented answers.
- When possible, suggest the next action the merchant can take in the system.
- Never invent features the platform does not have.`;

    const contexts = {
      campaigns: `\n\nYou are currently on the Email Campaigns screen.
Help the merchant with:
- Writing catchy subject lines and preview text
- Drafting email body copy in HTML
- Suggesting target segments for campaigns
- A/B test ideas for subject lines
- Email timing and frequency recommendations
- Keep responses focused on email marketing for e-commerce stores.`,

      demand: `\n\nYou are currently on the Demand Scoring screen.
Help the merchant with:
- Refining product ideas for better market fit
- Explaining demand scores and what they mean
- Suggesting pricing strategies
- Identifying target customer segments for new products
- Recommending launch timing and inventory levels
- Keep responses focused on product demand analysis.`,

      reports: `\n\nYou are currently on the Reports screen.
Help the merchant with:
- Interpreting revenue trends and daily sales patterns
- Understanding customer segment performance
- Identifying top-selling products and categories
- Recommending actions based on report data
- Keep responses focused on analytics and business intelligence.`,

      customers: `\n\nYou are currently on the Customers screen.
Help the merchant with:
- Suggesting follow-up actions for specific customer segments
- Recommending re-engagement strategies
- Explaining customer lifetime value and segmentation
- Drafting personalized outreach messages
- Keep responses focused on customer relationship management.`,

      products: `\n\nYou are currently on the Products screen.
Help the merchant with:
- Writing product descriptions and names
- Suggesting pricing and categorization
- Recommending inventory stocking levels
- SEO-friendly product title suggestions
- Keep responses focused on product management.`,

      crm: `\n\nYou are currently on the CRM Pipeline screen.
Help the merchant with:
- Moving deals through pipeline stages
- Suggesting next actions for open deals
- Redeeming deals and generating coupon codes
- Customer-deal linking strategies
- Keep responses focused on sales pipeline management.`,
    };

    return base + (contexts[context] || '');
  }

  static async chat(prompt, context) {
    const model = DEFAULT_MODEL;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key not configured. Set GOOGLE_API_KEY in your .env file.');
    }

    // Guardrail: check scope before calling Gemini
    if (!this.isInScope(prompt)) {
      return {
        text: "I'm here to help with SmartStore AI workflows like products, orders, customers, campaigns, reports, and AI insights. Ask me about your store and I'll help from there.",
        model: `gemini/${model} (Guardrail)`,
        guarded: true,
      };
    }

    const systemPrompt = this.buildSystemPrompt(context);

    const response = await ai.models.generateContent({
      model,
      contents: `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`,
    });

    return {
      text: response.text || '',
      model: `gemini/${model}`,
      guarded: false,
    };
  }

  static async generateCampaign(store, description, segment) {
    const model = DEFAULT_MODEL;
    const apiKey = process.env.GOOGLE_API_KEY;

    const prompt = `You are an expert e-commerce email marketer.

Store: ${store.name}
Target audience: ${segment || 'all customers'}
Campaign description: ${description}

Generate a JSON object with exactly these fields:
- name (string): a catchy campaign name (max 60 chars)
- subject (string): an engaging email subject line (max 80 chars)
- content_html (string): a professional marketing email in HTML format. Use inline styles sparingly. Include a greeting, body, CTA button text, and sign-off. Use {{name}} as the customer name placeholder.
- target_segment (string): one of [new, active, vip, at_risk, churned] or empty string if all customers

Output ONLY valid JSON.`;

    if (apiKey) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const text = response.text || '{}';
        const data = JSON.parse(text);

        return {
          name: data.name || 'AI Generated Campaign',
          subject: data.subject || 'Special Offer Inside',
          content_html: data.content_html || '<p>Hello {{name}},</p><p>Check out our latest offer!</p>',
          target_segment: data.target_segment || segment || '',
          model: `gemini/${model}`
        };
      } catch (err) {
        console.error('[AI] Campaign generation failed, falling back', err);
      }
    }

    return {
      name: `${store.name} Campaign`,
      subject: `Special Offer from ${store.name}!`,
      content_html: `<p>Hello {{name}},</p><p>We have an exciting new offer just for you at ${store.name}!</p><p><a href="#" style="padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;">Shop Now</a></p><p>Best regards,<br>${store.name} Team</p>`,
      target_segment: segment || '',
      model: `gemini/${model} (Static Fallback)`
    };
  }

  static getStatus() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const model = DEFAULT_MODEL;
    return {
      connected: !!apiKey,
      model: `gemini/${model}`,
      message: apiKey
        ? 'Gemini API is configured and ready.'
        : 'Gemini API key not set. AI responses will use static fallback.',
    };
  }
}

module.exports = AiService;
