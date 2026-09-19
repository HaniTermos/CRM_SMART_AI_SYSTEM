require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/database');
const AiConversation = require('../models/AiConversation');
const AiActionPlan = require('../models/AiActionPlan');
const AiUsage = require('../models/AiUsage');
const AiService = require('../services/AiService');

async function testAiCopilotSystem() {
  console.log('[Test] Starting AI Copilot System Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const userRes = await db.query(`SELECT id FROM users LIMIT 1`);
    const store_id = storeRes.rows[0].id;
    const user_id = userRes.rows[0].id;

    // 1. Create Conversation
    const conv = await AiConversation.create({ store_id, user_id, title: 'AI Copilot Test Conv' });
    assert(conv && conv.id, 'Created AI conversation');

    // 2. Fetch Conversation
    const fetchedConv = await AiConversation.findById(conv.id, store_id);
    assert(fetchedConv && fetchedConv.title === 'AI Copilot Test Conv', 'Fetched conversation by ID');

    // 3. Test Offline Heuristic Reasoning
    const heuristic = await AiService.generateStructuredResponse({
      prompt: 'Suggest menu price updates',
      system_instruction: 'Test instruction',
      context_snapshot: { store_name: 'Test Store' },
      feature: 'chat'
    });
    assert(heuristic && heuristic.response_text.includes('[Offline/Heuristic Mode]'), 'Offline heuristic fallback mode active');

    // 4. Test Action Plan Creation & Lookup
    const plan = await AiActionPlan.create({
      store_id,
      conversation_id: conv.id,
      title: 'Test Plan',
      summary: 'Summary text',
      idempotency_key: `plan_key_${Date.now()}`
    });
    assert(plan && plan.id, 'Created AI action plan');

    // Cleanup
    await db.query(`DELETE FROM ai_action_plans WHERE id = $1`, [plan.id]);
    await db.query(`DELETE FROM ai_conversations WHERE id = $1`, [conv.id]);

    console.log(`\nAI Copilot System Tests: ${passed} Passed, ${failed} Failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error in AI Copilot test:', err);
    process.exit(1);
  }
}

testAiCopilotSystem();
