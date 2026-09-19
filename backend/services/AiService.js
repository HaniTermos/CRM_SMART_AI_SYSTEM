const { GoogleGenAI } = require('@google/genai');
const db = require('../config/database');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

class AiService {
  constructor() {
    this.mode = process.env.AI_MODE || 'offline';
    this.model = DEFAULT_MODEL;
    if (process.env.GOOGLE_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
      } catch (err) {
        console.warn('[AiService] Failed to initialize GoogleGenAI client:', err.message);
      }
    }
  }

  // --- 1. Copilot & Structured Generation Engine (used by aiController) ---

  async generateStructuredResponse({ prompt, system_instruction, context_snapshot = {}, feature = 'chat' }) {
    if (this.mode === 'gemini' && this.ai) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            systemInstruction: system_instruction,
            responseMimeType: 'application/json',
          },
        });
        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        return {
          response_text: parsed.summary || parsed.message || text,
          structured: parsed,
          provider: 'google',
          model: this.model,
          tokens_used: response.usageMetadata?.totalTokenCount || 100,
        };
      } catch (err) {
        console.error('[AiService] Gemini API error, falling back to heuristic response:', err.message);
        return this.generateOfflineHeuristic({ prompt, context_snapshot, feature });
      }
    }

    return this.generateOfflineHeuristic({ prompt, context_snapshot, feature });
  }

  generateOfflineHeuristic({ prompt, context_snapshot = {}, feature }) {
    const storeName = context_snapshot.store_name || 'SmartStore AI';
    const textLower = (prompt || '').toLowerCase();

    if (textLower.includes('menu') || textLower.includes('price') || feature === 'cms') {
      return {
        response_text: `[Offline/Heuristic Mode] Analyzed menu & CMS performance for ${storeName}. Recommended optimizing hero section CTA and highlighting top 3 bestseller items.`,
        structured: {
          mode: 'offline_heuristic',
          summary: `Optimized section recommendations for ${storeName}`,
          suggested_actions: [
            { type: 'update_cms_section', target: 'hero', payload: { title: 'Fresh Seasonal Specialties' } }
          ]
        },
        provider: 'offline',
        model: 'heuristic-v1',
        tokens_used: 0,
      };
    }

    return {
      response_text: `[Offline/Heuristic Mode] SmartStore AI Business Assistant active for ${storeName}. System healthy, all channels operational.`,
      structured: {
        mode: 'offline_heuristic',
        summary: `Store Operational Status: Optimal`,
        metrics: { health_score: 98, status: 'operational' }
      },
      provider: 'offline',
      model: 'heuristic-v1',
      tokens_used: 0,
    };
  }

  // --- 2. Customer Insights & CRM Analysis ---

  async generateInsight(store, customer, orders = []) {
    const model = this.model || DEFAULT_MODEL;
    const apiKey = process.env.GOOGLE_API_KEY;

    const ordersContext = orders.map(o =>
      `- Order #${o.order_number || o.id}: $${o.total}, status: ${o.status}, date: ${new Date(o.created_at).toLocaleDateString()}`
    ).join('\n');

    if (apiKey && this.ai) {
      try {
        const prompt = `You are an expert e-commerce CRM analyst.

Store: ${store.name}
Customer: ${customer.name} (${customer.email || 'no email'})
Phone: ${customer.phone || 'no phone'}
Total spent: $${customer.total_spent || 0}
Total orders: ${customer.total_orders || 0}
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

        const response = await this.ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const text = response.text || '{}';
        const aiData = JSON.parse(text);

        return {
          kind: 'customer_analysis',
          summary: aiData.summary || `Customer ${customer.name} has placed ${orders.length} orders totaling $${customer.total_spent || 0}.`,
          next_action: aiData.next_action || 'Send a personalized follow-up email.',
          email_subject: aiData.email_subject || `Special Offer Just For You, ${customer.name}!`,
          email_body: aiData.email_body || `Hi ${customer.name},\n\nWe noticed you haven't shopped with us in a while. Here's a 10% discount code (WELCOME10) to use on your next purchase!\n\nThanks,\n${store.name} Team`,
          recommendations: Array.isArray(aiData.recommendations)
            ? aiData.recommendations.filter((r) => typeof r === 'string')
            : ['10% Discount', 'Upsell New Arrivals'],
          model: `gemini/${model}`
        };
      } catch (err) {
        console.error('[AI] Gemini insight request failed, falling back to static', err.message);
      }
    }

    return {
      kind: 'customer_analysis',
      summary: `Customer ${customer.name} has placed ${orders.length} orders with total spend of $${customer.total_spent || 0}.`,
      next_action: 'Send re-engagement coupon via SMS or email.',
      email_subject: `Special Offer Just For You, ${customer.name}!`,
      email_body: `Hi ${customer.name},\n\nWe miss you at ${store.name}! Here is an exclusive offer for your next visit.\n\nWarm regards,\n${store.name} Team`,
      recommendations: ['Re-engagement Offer', 'Loyalty Program Invite'],
      model: 'heuristic-v1'
    };
  }

  // --- 3. Guardrails & Chat Assistant ---

  isInScope(prompt) {
    if (!prompt) return true;
    const lower = prompt.toLowerCase();
    const inScope = [
      'product', 'products', 'item', 'items', 'order', 'orders', 'customer', 'customers',
      'campaign', 'campaigns', 'email', 'discount', 'discounts', 'coupon', 'coupons',
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
      'recipe', 'cooking',
      'movie', 'music', 'sport', 'game', 'gaming', 'politics', 'news',
      'medical', 'health', 'doctor', 'diagnosis', 'therapy',
      'legal', 'lawyer', 'court', 'contract',
    ];

    const hasInScope = inScope.some((k) => lower.includes(k));
    const hasOutOfScope = outOfScope.some((k) => lower.includes(k));
    if (hasOutOfScope && !hasInScope) return false;
    return true;
  }

  buildSystemPrompt(context) {
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
- Prefer short, practical, action-oriented answers.
- When possible, suggest the next action the merchant can take in the system.
- Never invent features the platform does not have.`;

    const contexts = {
      campaigns: `\n\nYou are currently on the Email Campaigns screen. Help with subject lines, email HTML body, and segments.`,
      demand: `\n\nYou are currently on the Demand Scoring screen. Help explain demand scores and product strategies.`,
      reports: `\n\nYou are currently on the Reports screen. Help interpret revenue and order metrics.`,
      customers: `\n\nYou are currently on the Customers screen. Help with segments and outreach.`,
      products: `\n\nYou are currently on the Products screen. Help with descriptions, names, and pricing.`,
      crm: `\n\nYou are currently on the CRM Pipeline screen. Help move deals through stages.`,
    };

    return base + (contexts[context] || '');
  }

  async chat(prompt, context) {
    const model = this.model || DEFAULT_MODEL;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey || !this.ai) {
      return {
        text: "I am ready to help you with store workflows, orders, and insights. (Offline fallback mode active)",
        model: 'heuristic-v1',
        guarded: false
      };
    }

    if (!this.isInScope(prompt)) {
      return {
        text: "I'm here to help with SmartStore AI workflows like products, orders, customers, campaigns, reports, and AI insights. Ask me about your store and I'll help from there.",
        model: `gemini/${model} (Guardrail)`,
        guarded: true,
      };
    }

    const systemPrompt = this.buildSystemPrompt(context);
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`,
      });
      return {
        text: response.text || '',
        model: `gemini/${model}`,
        guarded: false,
      };
    } catch (err) {
      console.error('[AI] Gemini chat failed, falling back:', err.message);
      return {
        text: "I experienced a temporary network issue contacting Gemini. Here is your store summary: all systems active.",
        model: 'heuristic-fallback',
        guarded: false
      };
    }
  }

  async generateCampaign(store, description, segment) {
    const model = this.model || DEFAULT_MODEL;
    const apiKey = process.env.GOOGLE_API_KEY;

    const prompt = `You are an expert e-commerce email marketer.
Store: ${store.name}
Target audience: ${segment || 'all customers'}
Campaign description: ${description}

Generate a JSON object with exactly these fields:
- name (string): catchy campaign name (max 60 chars)
- subject (string): engaging subject line (max 80 chars)
- content_html (string): professional marketing email HTML with greeting, body, CTA button, sign-off.
- target_segment (string): one of [new, active, vip, at_risk, churned] or empty string

Output ONLY valid JSON.`;

    if (apiKey && this.ai) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        const data = JSON.parse(response.text || '{}');
        return {
          name: data.name || `${store.name} Special Promotion`,
          subject: data.subject || `Exclusive Offer from ${store.name}!`,
          content_html: data.content_html || `<p>Hello {{name}},</p><p>We have a special treat for you at ${store.name}!</p>`,
          target_segment: data.target_segment || segment || '',
          model: `gemini/${model}`
        };
      } catch (err) {
        console.error('[AI] Campaign generation failed, falling back to static:', err.message);
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

  getStatus() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const model = this.model || DEFAULT_MODEL;
    return {
      connected: !!apiKey,
      model: `gemini/${model}`,
      message: apiKey
        ? 'Gemini API is configured and ready.'
        : 'Gemini API key not set. AI responses will use static fallback.',
    };
  }

  // --- 4. CMS Website & Page Planning (used by cmsController) ---

  async generateWebsitePlan(store, prompt) {
    return {
      storeName: store.name,
      sections: [
        {
          type: 'hero',
          content: {
            title: `Welcome to ${store.name}`,
            subtitle: prompt || 'Experience extraordinary dining and artisanal quality handcrafted daily.',
            cta_text: 'Order Online',
            cta_url: `/shop/${store.slug || 'menu'}`,
            secondary_cta_text: 'Book a Table',
            secondary_cta_url: '/reservations',
            image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
          },
          appearance: { style: 'modern', alignment: 'center' },
          background: { color: '#000000', overlay_opacity: 0.4 },
          layout: { width: 'full', padding_top: 'large', padding_bottom: 'large' }
        },
        {
          type: 'story',
          content: {
            eyebrow: 'Our Story',
            title: 'Crafted with Passion & Authenticity',
            paragraph: 'Every dish tells our story of fresh ingredients, time-honored traditions, and a passion for hospitality.',
            image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
          },
          appearance: { style: 'split', alignment: 'left' },
          background: { color: '#ffffff' },
          layout: { width: 'contained', padding_top: 'medium', padding_bottom: 'medium' }
        },
        {
          type: 'featured_products',
          content: {
            title: 'Featured Favorites',
            subtitle: 'Our guest favorites and signature creations',
            limit: 4
          },
          appearance: { columns: 4 },
          background: { color: '#f9fafb' },
          layout: { width: 'contained', padding_top: 'medium', padding_bottom: 'large' }
        }
      ]
    };
  }

  async editPagePlan(store, page, existingSections = [], prompt) {
    return {
      pageId: page.id,
      prompt,
      sections: existingSections.length > 0 ? existingSections : (await this.generateWebsitePlan(store, prompt)).sections
    };
  }
}

// Create singleton instance and bind all methods to support both:
// const AiService = require('./AiService');
// AiService.generateStructuredResponse(...) AND new AiService().generateStructuredResponse(...)
const aiServiceInstance = new AiService();

// Also assign methods statically to the class
for (const key of Object.getOwnPropertyNames(AiService.prototype)) {
  if (key !== 'constructor' && typeof aiServiceInstance[key] === 'function') {
    AiService[key] = aiServiceInstance[key].bind(aiServiceInstance);
  }
}

module.exports = aiServiceInstance;
module.exports.AiService = AiService;
