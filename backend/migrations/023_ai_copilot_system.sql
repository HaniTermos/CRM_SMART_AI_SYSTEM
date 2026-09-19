-- ============================================
-- SmartStore AI Migration 023: AI Copilot System
-- ============================================

-- 1. Store Credit Balances
CREATE TABLE IF NOT EXISTS public.ai_store_balances (
  store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  allocated_credits NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  purchased_credits NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  bonus_credits NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  used_credits NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  reserved_credits NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  refunded_credits NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  resets_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  auto_recharge BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Unified Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
  mode VARCHAR(50) NOT NULL DEFAULT 'general', -- general|analytics|growth|operations|inventory|crm|cms
  source VARCHAR(50) NOT NULL DEFAULT 'floating_icon', -- floating_icon|ai_page|dashboard|reports|cms|crm|inventory|orders
  context_snapshot JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active|archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Action Plans (Store-Scoped Idempotency)
CREATE TABLE IF NOT EXISTS public.ai_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  estimated_impact JSONB DEFAULT '{}',
  risk_level VARCHAR(20) NOT NULL DEFAULT 'medium', -- low|medium|high
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft|approved|executing|completed|partially_completed|failed|cancelled|rolled_back
  idempotency_key VARCHAR(255),
  created_by UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_idempotency UNIQUE(store_id, idempotency_key)
);

-- 4. Messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'tool', 'system')),
  content TEXT NOT NULL,
  structured_response JSONB DEFAULT NULL,
  action_plan_id UUID REFERENCES public.ai_action_plans(id) ON DELETE SET NULL,
  source_page VARCHAR(255) DEFAULT NULL,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Individual Actions with Classification
CREATE TABLE IF NOT EXISTS public.ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.ai_action_plans(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type VARCHAR(80) NOT NULL,
  classification VARCHAR(30) NOT NULL DEFAULT 'reversible', -- reversible|partially_reversible|irreversible|external
  target_type VARCHAR(50),
  target_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '[]',
  requires_confirmation BOOLEAN DEFAULT TRUE,
  status VARCHAR(30) NOT NULL DEFAULT 'proposed', -- proposed|approved|executing|completed|failed|cancelled|rolled_back
  error_message TEXT,
  result JSONB DEFAULT '{}',
  compensation_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Execution Logs (Idempotency & Sagas)
CREATE TABLE IF NOT EXISTS public.ai_action_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.ai_actions(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.ai_action_plans(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL, -- executing|completed|failed|compensated
  request_payload JSONB NOT NULL DEFAULT '{}',
  result_payload JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 7. Token & Usage Ledger (With Idempotency)
CREATE TABLE IF NOT EXISTS public.ai_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.ai_messages(id) ON DELETE SET NULL,
  action_plan_id UUID REFERENCES public.ai_action_plans(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'google',
  model VARCHAR(80) NOT NULL DEFAULT 'gemini-3.6-flash',
  feature VARCHAR(50) NOT NULL, -- chat|dashboard_briefing|reports|growth_strategy|cms_generation|cms_editing|crm|inventory|operations
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  credits_used NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  latency_ms INT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- reserved|completed|failed|refunded
  idempotency_key VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_usage_idempotency UNIQUE(store_id, idempotency_key)
);

-- 8. Scheduled AI Briefings & Deduplication
CREATE TABLE IF NOT EXISTS public.ai_scheduled_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL, -- daily_briefing|weekly_strategy|monthly_report
  content_hash VARCHAR(64) NOT NULL,
  summary TEXT NOT NULL,
  data_payload JSONB NOT NULL DEFAULT '{}',
  action_plan_id UUID REFERENCES public.ai_action_plans(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_kind_hash UNIQUE(store_id, kind, content_hash)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conv_store ON public.ai_conversations(store_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON public.ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_plans_store ON public.ai_action_plans(store_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_actions_plan ON public.ai_actions(plan_id);
CREATE INDEX IF NOT EXISTS idx_ai_exec_logs_action ON public.ai_action_execution_logs(action_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_store ON public.ai_usage_ledger(store_id, created_at DESC);
