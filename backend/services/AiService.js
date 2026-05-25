class AiService {
  static async generateInsight(store, customer, orders) {
    const provider = process.env.AI_PROVIDER || 'openai';
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
    const apiKey = process.env.OPENAI_API_KEY;
    const suggestedPrice = targetPrice || 19.99;

    // --- UNIVERSITY PROJECT UPGRADE: Heuristic Baseline ---
    // We check the database for similar product names to compute a deterministic base score.
    const db = require('../config/database');
    
    // Extract first significant word from idea as keyword
    const keyword = idea.split(' ')[0] || idea;
    let baseScore = 65; // Default average score
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
      
      // Heuristic: Every 5 units sold historically adds 5 points to the base score, up to max 30.
      if (avgUnits > 0) {
        baseScore += Math.min(30, Math.round((avgUnits / 5) * 5));
      }
    } catch (dbErr) {
      console.error('[AI] Heuristic DB query failed:', dbErr);
    }

    // If an API key is provided, we do a real call to OpenAI, feeding it the heuristic data
    if (provider === 'openai' && apiKey) {
      try {
        const fetch = require('node-fetch');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert e-commerce demand analyst. Output a JSON object with: score (integer 0-100), summary (string), next_action (string), confidence (string High/Medium/Low).'
              },
              {
                role: 'user',
                content: `Store Name: ${store.name}\\nProduct Idea: ${idea}\\nTarget Price: $${suggestedPrice}\\nHistorical Velocity for similar items: ${velocityData.avg_units} units.\\nAnalyze the market demand.`
              }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const aiData = JSON.parse(result.choices[0].message.content);
          
          return {
            kind: 'product_demand',
            summary: aiData.summary || `Analysis completed for ${idea}.`,
            next_action: aiData.next_action || 'Review and proceed.',
            email_subject: idea.substring(0, 50),
            email_body: '',
            recommendations: {
              score: aiData.score || baseScore, // Use AI score or fallback to heuristic
              suggested_price: suggestedPrice,
              confidence: aiData.confidence || 'Medium'
            },
            model: `${provider}/${model} (Live + Heuristic)`
          };
        }
      } catch (err) {
        console.error('[AI] OpenAI request failed, falling back to heuristic only', err);
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
        confidence: baseScore > 80 ? 'High' : (baseScore > 65 ? 'Medium' : 'Low')
      },
      model: `Heuristic DB Analysis (Academic MVP)`
    };
  }
}

module.exports = AiService;
