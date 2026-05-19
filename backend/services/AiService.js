// Simulated AI provider logic (translates Lovable Gateway patterns)

class AiService {
  static async generateInsight(store, customer, orders) {
    const provider = process.env.AI_PROVIDER || 'openai';
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // In a real implementation, this would call OpenAI or Gemini APIs using the keys in .env
    // For this MVP transition phase, we return a mocked structure identical to what the Lovable Gateway returned

    return {
      kind: 'customer_analysis',
      summary: `Customer ${customer.name} has placed ${orders.length} orders totaling $${customer.total_spent}. They prefer COD.`,
      next_action: `Send a personalized re-engagement email with a 10% discount on their favorite category.`,
      email_subject: `Special Offer Just For You, ${customer.name}!`,
      email_body: `Hi ${customer.name},\n\nWe noticed you haven't shopped with us in a while. Here is a 10% discount code (WELCOME10) to use on your next purchase!\n\nThanks,\n${store.name} Team`,
      recommendations: [
        { type: 'discount', value: '10%' },
        { type: 'product_upsell', value: 'New Arrivals' }
      ],
      model: `${provider}/${model}`
    };
  }

  static async scoreDemand(store, idea, targetPrice) {
    const provider = process.env.AI_PROVIDER || 'openai';
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Simulated scoring result based on the idea
    const score = Math.floor(Math.random() * 30) + 65; // realistic high score 65-95
    const suggestedPrice = targetPrice || 19.99;

    return {
      kind: 'product_demand',
      summary: `The product idea "${idea}" shows strong market potential. Analysis indicates healthy customer appeal and low competition in this store's category.`,
      next_action: `Launch as a test collection with a limited stock of 20 units.`,
      email_subject: idea.substring(0, 50), // Stored as the idea name in history
      email_body: '',
      recommendations: {
        score,
        confidence: score > 80 ? 'high' : 'medium',
        target_segments: ['VIP Customers', 'New Customers'],
        suggested_price: Number(suggestedPrice),
        risks: ['Initial supply chain setup delays', 'Niche category awareness effort'],
        positioning: 'Premium organic alternative with sustainable glass packaging.',
        idea,
        target_price: targetPrice ? Number(targetPrice) : null
      },
      model: `${provider}/${model}`
    };
  }
}

module.exports = AiService;
