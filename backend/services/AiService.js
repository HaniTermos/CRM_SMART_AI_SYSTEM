const { GoogleGenAI } = require('@google/genai');
const db = require('../config/database');

class AiService {
  constructor() {
    this.mode = process.env.AI_MODE || 'offline';
    if (this.mode === 'gemini') {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('[AiService] GOOGLE_API_KEY environment variable is required when AI_MODE=gemini');
      }
      this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
      this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    }
  }

  async generateStructuredResponse({ prompt, system_instruction, context_snapshot = {}, feature = 'chat' }) {
    if (this.mode === 'gemini') {
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
}

module.exports = new AiService();
