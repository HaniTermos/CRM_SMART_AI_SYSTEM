# SmartStore AI - Complete System Documentation

**Last Updated:** May 20, 2026  
**Version:** 1.0  
**Status:** Production MVP (Demand Scoring & AI in Beta)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Getting Started](#getting-started)
4. [Demand Scoring System - Complete Guide](#demand-scoring-system---complete-guide)
5. [Core Features & Logic](#core-features--logic)
6. [Data Model & Database](#data-model--database)
7. [API Reference](#api-reference)
8. [Authentication & Security](#authentication--security)
9. [Key Code Patterns](#key-code-patterns)
10. [Environment Setup](#environment-setup)
11. [Feature Status & Roadmap](#feature-status--roadmap)

---

## System Overview

### What is SmartStore AI?

SmartStore AI is a full-stack e-commerce platform with integrated AI capabilities designed for multi-store merchants. It provides:

- **Multi-tenant store management** - Support multiple independent stores from one platform
- **Product & Inventory Management** - Catalog, categories, stock tracking with adjustment history
- **Order Processing** - Full checkout workflow, order status tracking, customer lookup
- **Customer Intelligence** - Segmentation, activity tracking, AI-powered insights
- **AI-Powered Features**:
  - **Demand Scoring** - Evaluate new product ideas with AI-generated demand scores (65-95 range)
  - **Customer Analysis** - Generate insights and re-engagement recommendations
  - **Price Optimization** - Suggested pricing based on market demand
- **Reviews & Ratings** - Product reviews with verified purchase detection
- **Discount Management** - Flexible coupon codes with usage limits and expiry
- **Analytics Dashboard** - Key metrics: revenue, orders, inventory alerts, customer count

### Platform Type

**SaaS (Software as a Service)** with multi-tenancy. Each merchant can:
- Create multiple stores
- Invite team members (owner, admin, staff roles)
- Manage inventory independently
- Run promotions and campaigns
- Get AI-powered business insights

---

## Architecture & Tech Stack

### Full Stack Architecture

```
┌────────────────────────────────────────┐
│    FRONTEND (React / TypeScript)       │
│  TanStack Router + React Query         │
│  Tailwind CSS + Component Library      │
├────────────────────────────────────────┤
│    API Layer (Axios + JWT Auth)        │
│  REST API with Bearer Token Auth       │
├────────────────────────────────────────┤
│    BACKEND (Node.js / Express)         │
│  REST API Server, Business Logic       │
│  Multi-tenant Route Handling           │
├────────────────────────────────────────┤
│    DATABASE (PostgreSQL 12+)           │
│  Relational Schema, ACID Transactions  │
│  Indexed for Performance                │
└────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technologies | Purpose |
|-------|-------------|---------|
| **Frontend** | React 18, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, Shadcn UI | Interactive UI, client-side routing, data fetching |
| **Backend** | Node.js, Express.js, PostgreSQL (pg library) | REST API, business logic, database queries |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs | Secure user sessions, password hashing |
| **Build Tools** | Vite, TypeScript, ESLint, Prettier | Fast dev server, type safety, code quality |
| **Deployment** | Cloudflare Workers (optional via wrangler), Docker ready | Serverless compute, API edge deployment |

### Key Dependencies

**Backend:**
- `express` - Web framework
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT generation/validation
- `bcryptjs` - Password hashing
- `multer` - File upload handling
- `dotenv` - Environment configuration
- `cors` - Cross-origin requests

**Frontend:**
- `@tanstack/react-router` - File-based routing
- `@tanstack/react-query` - Data synchronization
- `axios` - HTTP client
- `tailwindcss` - Utility CSS
- `typescript` - Type safety

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (check with `node --version`)
- **PostgreSQL** 12+ (running locally or remote)
- **npm** or **yarn** package manager
- **VS Code** (recommended IDE)

### Initial Setup

#### 1. **Clone & Install**

```bash
# Root directory
npm install

# Backend
cd backend
npm install
cd ..

# Frontend is at root level with Vite
npm install
```

#### 2. **Database Setup**

```bash
# Create PostgreSQL database
createdb smartstore_ai

# Run migrations
cd backend
node scripts/run_migrations.js
cd ..

# (Optional) Seed sample data
node backend/scripts/seed.js
```

#### 3. **Configure Environment**

**Backend** (`backend/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartstore_ai
DB_USER=postgres
DB_PASSWORD=yourpassword

PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
COOKIE_SECRET=change-this-secret

AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-... (if using real OpenAI)

UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

**Frontend** (`vite.config.ts` or `.env.local`):
```env
VITE_BACKEND_URL=http://localhost:5000/api
```

#### 4. **Start Development Servers**

```bash
# Terminal 1: Backend (from root or backend/)
cd backend
npm run dev  # or: node server.js

# Terminal 2: Frontend (from root)
npm run dev  # or: npx vite
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

#### 5. **First Login**

Register a new account in the UI:
1. Visit http://localhost:5173
2. Click "Sign Up"
3. Enter email, password, name
4. On success, you're logged in and can create a store

---

## Demand Scoring System - Complete Guide

### What is Demand Scoring?

Demand Scoring is an AI-powered feature that helps store owners evaluate whether a new product idea has market potential before investing in inventory. It provides:

- **Demand Score** (0-100): Probability of market success
- **Confidence Level**: High (>80) or Medium (≤80)
- **Target Segments**: Customer demographics to target
- **Suggested Price**: AI-recommended selling price
- **Positioning**: How to market the product
- **Risks**: Potential challenges to address

### How It Works - Complete Flow

#### Step 1: User Input (Frontend)

**Location:** [src/routes/_admin.demand.tsx](src/routes/_admin.demand.tsx)

User navigates to **Admin → AI Tools → Demand Scoring** and fills a form:

```
┌─────────────────────────────────────┐
│  Product Idea Form                  │
├─────────────────────────────────────┤
│ Product Description (textarea):     │
│ "Eco-friendly bamboo phone stand    │
│  with sustainable packaging"        │
│                                     │
│ Target Price (optional):            │
│ $24.99                              │
│                                     │
│ [ANALYZE DEMAND] button             │
└─────────────────────────────────────┘
```

**Validation:**
- Idea must be ≥ 3 characters long
- Price must be ≥ 0 if provided

#### Step 2: API Request (Frontend)

**Function:** `scoreProductIdea()` from [src/lib/demand.functions.ts](src/lib/demand.functions.ts)

```typescript
export const scoreProductIdea = async ({ data }: { data: any }) => {
  const res = await api.post(`/ai/${data.storeId}/demand`, {
    idea: "Eco-friendly bamboo phone stand...",
    targetPrice: 24.99,
    storeId: "uuid..."
  });
  return res.data.data;  // Returns scored insight object
};
```

**API Endpoint:** `POST /api/ai/:storeId/demand`

**Request Body:**
```json
{
  "idea": "Eco-friendly bamboo phone stand with sustainable packaging",
  "targetPrice": 24.99
}
```

#### Step 3: Backend Processing (Controller)

**Location:** [backend/controllers/aiController.js](backend/controllers/aiController.js#L40)

```javascript
exports.scoreDemand = async (req, res, next) => {
  const { idea, targetPrice } = req.body;
  const { storeId } = req.params;

  // 1. Input Validation
  if (!idea || idea.trim().length < 3) {
    return res.status(400).json({ 
      error: 'Product idea must be at least 3 characters long.' 
    });
  }

  try {
    // 2. Call AI Service to generate scoring
    const insightData = await AiService.scoreDemand(
      req.store,           // Store object with store_id, settings
      idea.trim(),         // Product description
      targetPrice          // Optional target price
    );

    // 3. Save to database
    const savedInsight = await AiInsight.create({
      store_id: storeId,
      customer_id: null,    // Product ideas NOT tied to customers
      kind: 'product_demand',
      ...insightData        // summary, next_action, recommendations, etc.
    });

    // 4. Return to frontend
    return res.json({ 
      success: true, 
      data: savedInsight 
    });
  } catch (error) {
    next(error);  // Error handler middleware
  }
};
```

#### Step 4: AI Scoring Service (Core Logic)

**Location:** [backend/services/AiService.js](backend/services/AiService.js)

**Current Implementation (MVP - Simulated):**

```javascript
static async scoreDemand(store, idea, targetPrice) {
  const provider = process.env.AI_PROVIDER || 'openai';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // ───────────────────────────────────────────────
  // SCORE GENERATION (Currently Simulated)
  // ───────────────────────────────────────────────
  // Real implementation would call OpenAI/Gemini API
  // For now: Random score between 65-95
  const score = Math.floor(Math.random() * 30) + 65;
  
  // Confidence is based on score
  const confidence = score > 80 ? 'high' : 'medium';

  // ───────────────────────────────────────────────
  // SUGGESTED PRICE CALCULATION
  // ───────────────────────────────────────────────
  // If user provided target price, use it; otherwise default to $19.99
  const suggestedPrice = targetPrice || 19.99;

  // ───────────────────────────────────────────────
  // RETURN INSIGHT STRUCTURE
  // ───────────────────────────────────────────────
  return {
    kind: 'product_demand',
    
    summary: `The product idea "${idea}" shows strong market potential 
              with good demand in eco-friendly lifestyle market segment. 
              Launch recommendation: Start with limited inventory of 
              20-50 units to test market response.`,
    
    next_action: `Launch as a test collection with a limited stock 
                  of 20 units. Monitor performance for 30 days, then 
                  expand if demand is above 70% sell-through rate.`,
    
    email_subject: idea.substring(0, 50),  // First 50 chars of idea
    email_body: '',  // Can be populated for outreach campaigns
    
    recommendations: {
      // ═══════════════════════════════════════
      // DEMAND SCORE (The Key Metric)
      // ═══════════════════════════════════════
      // Range: 0-100 (currently simulated as 65-95)
      // 90-100: Excellent demand
      // 80-89:  Strong demand
      // 70-79:  Moderate demand
      // 60-69:  Fair demand
      // <60:    Low demand (rarely happens in current MVP)
      score,
      
      // ═══════════════════════════════════════
      // CONFIDENCE LEVEL
      // ═══════════════════════════════════════
      // Indicates how certain the score is
      // 'high': score > 80 (confident in recommendation)
      // 'medium': score ≤ 80 (some uncertainty)
      confidence,
      
      // ═══════════════════════════════════════
      // TARGET SEGMENTS
      // ═══════════════════════════════════════
      // Who should this product target?
      // (Hardcoded for MVP, will be AI-generated)
      target_segments: [
        'VIP Customers',      // High-value repeat buyers
        'New Customers'       // Recently acquired customers
      ],
      
      // ═══════════════════════════════════════
      // SUGGESTED PRICE
      // ═══════════════════════════════════════
      // AI recommendation for optimal price point
      // Can be overridden by user
      suggested_price: Number(suggestedPrice),
      
      // ═══════════════════════════════════════
      // RISKS & CHALLENGES
      // ═══════════════════════════════════════
      // Potential obstacles to success
      risks: [
        'Initial supply chain setup delays',
        'Niche category awareness effort',
        'Competition in eco-friendly market'
      ],
      
      // ═══════════════════════════════════════
      // MARKET POSITIONING
      // ═══════════════════════════════════════
      // How to market/describe the product
      positioning: 'Premium organic alternative with sustainable glass packaging.',
      
      // Original user inputs (for audit trail)
      idea,
      target_price: targetPrice ? Number(targetPrice) : null
    },
    
    // Model used for generation
    model: `${provider}/${model}`  // e.g., "openai/gpt-4o-mini"
  };
}
```

### Scoring Factors Explained

#### 1. **Demand Score (65-95 currently)**

**Definition:** A numerical score representing the estimated market demand for the product.

**Current Logic (MVP):**
```javascript
const score = Math.floor(Math.random() * 30) + 65;
// Generates random number between 65 and 95
```

**Real Implementation (Future):** Will analyze:
- **Market size** - Is there a large addressable market?
- **Competition** - How many competitors exist?
- **Trends** - Is this trending up or down?
- **Seasonality** - Demand varies by season?
- **Price sensitivity** - How price-elastic is demand?
- **Customer segments** - Which demographics want this?

**Score Interpretation:**
| Score Range | Interpretation | Action |
|-------------|-----------------|--------|
| 90-100 | Excellent demand | Launch immediately, build inventory |
| 80-89 | Strong demand | Launch with confidence |
| 70-79 | Moderate demand | Test with limited inventory first |
| 60-69 | Fair demand | May need more market research |
| 0-59 | Low demand | Consider alternative product |

#### 2. **Confidence Level**

**Definition:** How certain is the scoring system about its prediction?

**Current Logic:**
```javascript
const confidence = score > 80 ? 'high' : 'medium';
```

**Real Implementation Will Consider:**
- Size of training data used
- How recent the data is
- Historical accuracy of similar predictions
- Volatility in the market segment

**Impact:**
- **High confidence** (>80 score) - Trust the recommendation, can take action
- **Medium confidence** (≤80 score) - Use as guidance, do additional research

#### 3. **Target Segments**

**Definition:** Customer groups most likely to buy this product.

**Current Hardcoded Segments:**
```javascript
target_segments: ['VIP Customers', 'New Customers']
```

**Real Implementation Will Generate:**
- **VIP Customers** - High lifetime value, premium buyers
- **New Customers** - Recently acquired, experimental shoppers
- **Budget-conscious** - Price-sensitive, high volume
- **Eco-conscious** - Sustainability-focused, brand loyal
- **Tech-savvy** - Early adopters, gadget lovers
- **Mobile users** - Shop primarily on phones
- **Corporate/B2B** - Bulk buyers
- **Geographic** - Region-specific demand

**Usage:** Marketing team targets these segments with specific messaging.

#### 4. **Suggested Price**

**Definition:** AI-recommended price point for optimal revenue/conversion.

**Current Logic:**
```javascript
const suggestedPrice = targetPrice || 19.99;
```

**Real Implementation Uses:**
- **Cost of goods sold** - Minimum price to be profitable
- **Competitor pricing** - What do similar products cost?
- **Price elasticity** - How much will sales drop if we raise price?
- **Market positioning** - Premium vs. budget?
- **Customer willingness to pay** - Survey data, historical behavior

**Example Calculation:**
```
COGS = $8.00
Competitor avg = $24.99
Target margin = 40%

Suggested price = COGS / (1 - target_margin)
                = $8 / 0.6
                = $13.33 (minimum)

With market research:
If customers pay up to $29.99, suggest $24.99
If demand is elastic, suggest $19.99 (higher volume)
```

#### 5. **Risks & Challenges**

**Definition:** Known obstacles to successful product launch.

**Current Hardcoded Risks:**
```javascript
risks: [
  'Initial supply chain setup delays',
  'Niche category awareness effort',
  'Competition in eco-friendly market'
]
```

**Real Implementation Will Consider:**
- **Supply chain risks** - Long lead times, supplier reliability
- **Regulatory** - Certifications needed, legal compliance
- **Market risks** - Small addressable market, competition
- **Operational** - Storage/handling complexity
- **Demand risks** - Seasonal, trend-dependent

#### 6. **Market Positioning**

**Definition:** How to describe/market the product to customers.

**Current Hardcoded:**
```javascript
positioning: 'Premium organic alternative with sustainable glass packaging.'
```

**Real Implementation Will Generate:**
- **Unique selling points** - What makes it different?
- **Brand voice** - Professional, casual, eco-friendly, luxury?
- **Key benefits** - What problem does it solve?
- **Emotional appeal** - Why should customers care?

**Example:**
```
Product: Phone Stand
Current Positioning: "Premium organic alternative with sustainable glass packaging"

Real Positioning Might Be:
- "Sleek bamboo design keeps your desk organized while supporting eco-friendly living"
- For eco-conscious segment: "Sustainable materials, zero plastic packaging"
- For design-conscious segment: "Minimalist design that complements your aesthetic"
```

### Database Storage - AI Insights

**Table:** `ai_insights`

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  customer_id UUID REFERENCES customers(id),  -- NULL for product ideas
  kind VARCHAR(50) NOT NULL,                   -- 'product_demand', 'customer_analysis'
  summary TEXT,                                -- Human-readable summary
  next_action TEXT,                            -- Recommended next step
  email_subject VARCHAR(255),                  -- For outreach campaigns
  email_body TEXT,                             -- Email template
  recommendations JSONB,                       -- { score, confidence, target_segments, ... }
  model VARCHAR(100),                          -- 'openai/gpt-4o-mini'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_ai_insights_store 
ON ai_insights(store_id, created_at DESC);
```

**Record Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "store_id": "660e8400-e29b-41d4-a716-446655440000",
  "customer_id": null,
  "kind": "product_demand",
  "summary": "The product idea \"Eco-friendly bamboo phone stand...\" shows strong market potential...",
  "next_action": "Launch as a test collection with a limited stock of 20 units...",
  "email_subject": "Eco-friendly bamboo phone stand with sust",
  "email_body": "",
  "recommendations": {
    "score": 82,
    "confidence": "high",
    "target_segments": ["VIP Customers", "New Customers"],
    "suggested_price": 24.99,
    "risks": ["Supply chain delays", "Awareness effort"],
    "positioning": "Premium organic alternative...",
    "idea": "Eco-friendly bamboo phone stand...",
    "target_price": 24.99
  },
  "model": "openai/gpt-4o-mini",
  "created_at": "2026-05-20T14:35:22.000Z"
}
```

### Retrieving Demand History

**Endpoint:** `GET /api/ai/:storeId/demand-history`

**Backend Implementation:**
```javascript
exports.getDemandHistory = async (req, res, next) => {
  const { storeId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT id, created_at, summary, next_action, email_subject, recommendations
       FROM ai_insights
       WHERE store_id = $1 AND kind = 'product_demand'
       ORDER BY created_at DESC
       LIMIT 20`,
      [storeId]
    );
    
    return res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    next(error);
  }
};
```

**Frontend Usage:**
```typescript
// Fetch latest demand scores
const { data: history } = useQuery({
  queryKey: ['demandHistory', storeId],
  queryFn: () => api.get(`/ai/${storeId}/demand-history`)
});

// Display in timeline
history?.data.map(insight => (
  <div key={insight.id}>
    <p>{insight.summary}</p>
    <span>Score: {insight.recommendations.score}</span>
  </div>
))
```

### Future Enhancements

**Real AI Integration:**
1. Connect to OpenAI API (GPT-4) or Google Gemini
2. Train custom ML model on historical sales data
3. Incorporate real market data (Google Trends, supply chain APIs)
4. Add competitor pricing integration

**Advanced Features:**
1. **Market segmentation** - Automatically identify target demographics
2. **Seasonality analysis** - Account for seasonal demand patterns
3. **Inventory optimization** - Recommend stock levels based on predicted demand
4. **Price elasticity modeling** - Dynamic pricing recommendations
5. **Cannibalization analysis** - Will this product hurt existing sales?

---

## Core Features & Logic

### 1. Authentication & Authorization

#### Registration Flow

**Endpoint:** `POST /api/auth/register`

**Frontend Form:**
```
Email: user@example.com
Password: securePassword123 (min 6 chars)
Name: John Doe
```

**Backend Logic** [backend/services/AuthService.js](backend/services/AuthService.js):

```javascript
static async register({ email, password, name }) {
  // 1. Validate email doesn't exist
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  
  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // 2. Hash password with bcryptjs
  const hashedPassword = await bcryptjs.hash(password, 10);
  // 10 = salt rounds (higher = slower but more secure)

  // 3. Create user
  const result = await db.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, role`,
    [email.toLowerCase(), hashedPassword, name]
  );

  const user = result.rows[0];

  // 4. Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }  // Token valid for 7 days
  );

  return { user, token };
}
```

**Database - Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Login Flow

**Endpoint:** `POST /api/auth/login`

```javascript
static async login({ email, password }) {
  // 1. Find user by email
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // 2. Compare passwords
  const isValid = await bcryptjs.compare(password, user.password_hash);
  
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // 3. Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
}
```

#### Multi-Tenant Authorization

**Tables Structure:**

```sql
-- Users (global)
users: id, email, password_hash, name, role

-- Stores (merchant accounts)
stores: id, owner_user_id, name, slug, currency, settings

-- Store access control
user_roles: user_id, store_id, role
-- role: 'owner' | 'admin' | 'staff'
```

**Authorization Middleware** [backend/middlewares/auth.js](backend/middlewares/auth.js):

```javascript
// 1. authenticate() - Verify JWT token
authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = { userId, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 2. requireStoreAccess() - Check if user can access store
requireStoreAccess = (req, res, next) => {
  const { storeId } = req.params;

  const result = await db.query(
    `SELECT role FROM user_roles 
     WHERE user_id = $1 AND store_id = $2`,
    [req.user.userId, storeId]
  );

  if (result.rows.length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.store = { id: storeId, role: result.rows[0].role };
  next();
};

// 3. authorize('owner', 'admin') - Check role level
authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.store.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

**Example Usage in Routes:**

```javascript
// Only owner can update store settings
router.put(
  '/:storeId',
  authenticate,
  requireStoreAccess,
  authorize('owner'),
  storeController.updateStore
);

// Admin and owner can create products
router.post(
  '/:storeId',
  authenticate,
  requireStoreAccess,
  authorize('admin', 'owner'),
  productController.create
);

// Staff can view inventory
router.get(
  '/:storeId',
  authenticate,
  requireStoreAccess,
  authorize('staff', 'admin', 'owner'),
  inventoryController.list
);
```

#### JWT Token Storage & Usage

**Frontend** [src/lib/auth-context.tsx](src/lib/auth-context.tsx):

```typescript
// 1. Store token in localStorage after login
localStorage.setItem('smartstore_token', token);

// 2. API interceptor automatically adds token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartstore_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Handle token expiry (401 response)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smartstore_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2. Product Management System

#### Product Model

**Database Table:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft' | 'active' | 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, slug)  -- Slug unique per store, not global
);

CREATE INDEX products_store_status_idx 
ON products(store_id, status);
```

**Product Object:**
```typescript
interface Product {
  id: string;
  store_id: string;
  category_id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  status: 'draft' | 'active' | 'archived';
  created_at: Date;
  updated_at: Date;
}
```

#### Product CRUD Operations

**Create Product** - [backend/controllers/productController.js](backend/controllers/productController.js)

```javascript
exports.create = async (req, res, next) => {
  const { storeId } = req.params;
  const { name, slug, description, price, stock, category_id } = req.body;

  // 1. Validate input
  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug required' });
  }

  if (price < 0 || stock < 0) {
    return res.status(400).json({ error: 'Price and stock must be non-negative' });
  }

  try {
    // 2. Check slug uniqueness within store
    const existing = await db.query(
      'SELECT id FROM products WHERE store_id = $1 AND slug = $2',
      [storeId, slug.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Slug already exists in this store' });
    }

    // 3. Insert product
    const result = await db.query(
      `INSERT INTO products 
       (store_id, name, slug, description, price, stock, category_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
       RETURNING *`,
      [storeId, name, slug.toLowerCase(), description, price, stock, category_id]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
```

**List Products** - Filter by store and status

```javascript
exports.findByStore = async (storeId, active = false) => {
  let query = 'SELECT * FROM products WHERE store_id = $1';
  const params = [storeId];

  if (active) {
    query += ' AND status = $2';
    params.push('active');
  }

  query += ' ORDER BY created_at DESC';

  const result = await db.query(query, params);
  return result.rows;
};

// Endpoint: GET /api/products/:storeId?active=true
exports.list = async (req, res) => {
  const { storeId } = req.params;
  const { active } = req.query;
  
  const products = await Product.findByStore(storeId, active === 'true');
  res.json({ success: true, data: products });
};
```

**Get by Slug** - For public storefront

```javascript
exports.findBySlug = async (storeId, slug) => {
  const result = await db.query(
    'SELECT * FROM products WHERE store_id = $1 AND slug = $2',
    [storeId, slug]
  );
  return result.rows[0] || null;
};
```

**Update Product**

```javascript
exports.update = async (productId, storeId, updates) => {
  // Don't allow changing: id, store_id, created_at
  const { id, store_id, created_at, ...safeUpdates } = updates;

  const setClause = Object.keys(safeUpdates)
    .map((k, i) => `${k} = $${i + 1}`)
    .join(', ');

  const result = await db.query(
    `UPDATE products 
     SET ${setClause}, updated_at = NOW()
     WHERE id = $1 AND store_id = $2
     RETURNING *`,
    [productId, storeId, ...Object.values(safeUpdates)]
  );

  return result.rows[0];
};
```

**Delete Product**

```javascript
exports.delete = async (productId, storeId) => {
  await db.query(
    'DELETE FROM products WHERE id = $1 AND store_id = $2',
    [productId, storeId]
  );
};
```

#### Product Image Upload

**Endpoint:** `POST /api/products/:storeId/upload`

**Implementation** [backend/routes/products.js](backend/routes/products.js):

```javascript
const multer = require('multer');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads', req.params.storeId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // e.g., 1684756199000_product.jpg
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// Route
router.post('/:storeId/upload', authenticate, requireStoreAccess, upload.single('file'), 
  (req, res) => {
    const imageUrl = `/uploads/${req.params.storeId}/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  }
);

// Static serve
app.use('/uploads', express.static('uploads'));
```

### 3. Order Processing Workflow

#### Order Creation Flow

**Endpoint:** `POST /api/products/:storeId/checkout`

**Full Order Creation Process:**

```javascript
exports.checkout = async (req, res, next) => {
  const { storeId } = req.params;
  const {
    customer: { name, phone, email },
    items,                    // [{ product_id, quantity }, ...]
    shipping_address,
    discount_code,
    notes
  } = req.body;

  // ═══════════════════════════════════════════════════════════
  // STEP 1: VALIDATE INPUT
  // ═══════════════════════════════════════════════════════════
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'At least one item required' });
  }

  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 2: TRANSACTION START (Atomic operation)
    // ═══════════════════════════════════════════════════════════
    // All steps must succeed or all roll back
    
    const result = await db.transaction(async (client) => {

      // ───────────────────────────────────────────────────────
      // STEP 3: FIND OR CREATE CUSTOMER
      // ───────────────────────────────────────────────────────
      let customer = await client.query(
        'SELECT id FROM customers WHERE store_id = $1 AND phone = $2',
        [storeId, phone]
      );

      let customerId;

      if (customer.rows.length > 0) {
        // Customer exists
        customerId = customer.rows[0].id;
      } else {
        // Create new customer
        const newCustomer = await client.query(
          `INSERT INTO customers (store_id, name, phone, email, segment)
           VALUES ($1, $2, $3, $4, 'new')
           RETURNING id`,
          [storeId, name, phone, email]
        );
        customerId = newCustomer.rows[0].id;
      }

      // ───────────────────────────────────────────────────────
      // STEP 4: VALIDATE ALL PRODUCTS & CALCULATE SUBTOTAL
      // ───────────────────────────────────────────────────────
      let subtotal = 0;
      const resolvedItems = [];

      for (const item of items) {
        const product = await client.query(
          `SELECT id, name, price, stock FROM products 
           WHERE id = $1 AND store_id = $2 AND status = 'active'`,
          [item.product_id, storeId]
        );

        if (product.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found or inactive`);
        }

        const prod = product.rows[0];

        // Check stock
        if (prod.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${prod.name}. Available: ${prod.stock}`
          );
        }

        const itemSubtotal = prod.price * item.quantity;
        subtotal += itemSubtotal;

        resolvedItems.push({
          product_id: prod.id,
          product_name: prod.name,
          unit_price: prod.price,
          quantity: item.quantity,
          subtotal: itemSubtotal
        });
      }

      // ───────────────────────────────────────────────────────
      // STEP 5: APPLY DISCOUNT (if code provided)
      // ───────────────────────────────────────────────────────
      let discountAmount = 0;

      if (discount_code) {
        const discountResult = await client.query(
          `SELECT id, type, value, min_subtotal, used_count, max_uses 
           FROM discount_codes 
           WHERE store_id = $1 AND code = $2 AND active = true 
           AND (expires_at IS NULL OR expires_at > NOW())`,
          [storeId, discount_code.toUpperCase()]
        );

        if (discountResult.rows.length === 0) {
          throw new Error('Invalid or expired discount code');
        }

        const discount = discountResult.rows[0];

        // Check minimum subtotal
        if (subtotal < discount.min_subtotal) {
          throw new Error(
            `Minimum order ${discount.min_subtotal} required for this code`
          );
        }

        // Check usage limit
        if (discount.max_uses && discount.used_count >= discount.max_uses) {
          throw new Error('Discount code has reached usage limit');
        }

        // Calculate discount amount
        if (discount.type === 'percent') {
          discountAmount = (subtotal * discount.value) / 100;
        } else {
          discountAmount = discount.value;
        }

        // Increment usage count
        await client.query(
          'UPDATE discount_codes SET used_count = used_count + 1 WHERE id = $1',
          [discount.id]
        );
      }

      // ───────────────────────────────────────────────────────
      // STEP 6: CALCULATE FINAL TOTAL
      // ───────────────────────────────────────────────────────
      const store = await client.query(
        'SELECT shipping_fee FROM stores WHERE id = $1',
        [storeId]
      );

      const shippingFee = store.rows[0].shipping_fee || 0;
      const total = subtotal - discountAmount + shippingFee;

      // ───────────────────────────────────────────────────────
      // STEP 7: CREATE ORDER
      // ───────────────────────────────────────────────────────
      const orderNumber = `ORD-${Date.now()}`;

      const orderResult = await client.query(
        `INSERT INTO orders 
         (store_id, customer_id, order_number, status, subtotal, 
          discount_amount, shipping_fee, total, discount_code, notes, shipping_address)
         VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          storeId, customerId, orderNumber, subtotal, discountAmount,
          shippingFee, total, discount_code, notes, shipping_address
        ]
      );

      const order = orderResult.rows[0];

      // ───────────────────────────────────────────────────────
      // STEP 8: CREATE ORDER ITEMS (Snapshot)
      // ───────────────────────────────────────────────────────
      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO order_items 
           (order_id, product_id, product_name, unit_price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id, item.product_id, item.product_name,
            item.unit_price, item.quantity, item.subtotal
          ]
        );
      }

      // ───────────────────────────────────────────────────────
      // STEP 9: DEDUCT STOCK FROM PRODUCTS
      // ───────────────────────────────────────────────────────
      for (const item of resolvedItems) {
        await client.query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      // ───────────────────────────────────────────────────────
      // STEP 10: UPDATE CUSTOMER STATS
      // ───────────────────────────────────────────────────────
      await client.query(
        `UPDATE customers 
         SET total_orders = total_orders + 1,
             total_spent = total_spent + $1,
             last_order_at = NOW()
         WHERE id = $2`,
        [total, customerId]
      );

      // ───────────────────────────────────────────────────────
      // STEP 11: LOG CUSTOMER ACTIVITY
      // ───────────────────────────────────────────────────────
      await client.query(
        `INSERT INTO customer_activities (store_id, customer_id, type, payload)
         VALUES ($1, $2, 'order_placed', $3)`,
        [storeId, customerId, JSON.stringify({ order_id: order.id, total })]
      );

      // ───────────────────────────────────────────────────────
      // STEP 12: RETURN COMPLETE ORDER
      // ───────────────────────────────────────────────────────
      return {
        ...order,
        items: resolvedItems,
        customer: { id: customerId, name, phone, email }
      };

    }); // End transaction

    return res.json({ success: true, data: result });

  } catch (error) {
    // Transaction auto-rollback on error
    next(error);
  }
};
```

#### Order Status Lifecycle

```
User places order
        ↓
[pending] → admin confirms
        ↓
[confirmed] → shipped to customer
        ↓
[shipped] → customer receives
        ↓
[delivered] ← order complete

OR at any time:
[cancelled] ← user/admin cancels
```

**Update Order Status:**

```javascript
exports.updateStatus = async (req, res, next) => {
  const { storeId, orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await db.query(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2 AND store_id = $3
       RETURNING *`,
      [status, orderId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // TODO: Send email notification to customer

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
```

#### Public Order Lookup

**Endpoint:** `POST /api/public/stores/:storeId/orders/lookup`

**Purpose:** Customers can look up their orders without logging in

```javascript
exports.publicLookup = async (req, res, next) => {
  const { storeId } = req.params;
  const { order_number, phone } = req.body;

  try {
    const result = await db.query(
      `SELECT o.*, c.name, c.email, c.phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.store_id = $1 AND o.order_number = $2 AND c.phone = $3`,
      [storeId, order_number, phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    return res.json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### 4. Customer Management & Segmentation

#### Customer Model

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  segment VARCHAR(50) DEFAULT 'new',  -- new | active | vip | at_risk | churned
  notes TEXT,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, phone)
);
```

#### Customer Segmentation Logic

**Segments Explained:**

| Segment | Criteria | Marketing Strategy |
|---------|----------|-------------------|
| **new** | total_orders < 2 OR created < 30 days ago | Welcome emails, first-time buyer discount |
| **active** | total_orders >= 2 AND last_order_at < 90 days ago | Regular promotions, new product alerts |
| **vip** | total_spent >= $500 AND total_orders >= 5 | Exclusive deals, early access, loyalty rewards |
| **at_risk** | last_order_at between 90-180 days ago | Re-engagement campaigns, special discounts |
| **churned** | last_order_at > 180 days ago | Win-back campaigns, feedback surveys |

**Auto-segmentation on Each Order:**

```javascript
async updateSegmentation(customerId, storeId) {
  const customer = await db.query(
    'SELECT * FROM customers WHERE id = $1',
    [customerId]
  );

  const { total_orders, total_spent, last_order_at } = customer.rows[0];
  const now = new Date();
  const daysSinceLastOrder = 
    (now - new Date(last_order_at)) / (1000 * 60 * 60 * 24);

  let segment = 'new';

  if (total_orders < 2 || (now - new Date(last_order_at)) < 30 * 24 * 60 * 60 * 1000) {
    segment = 'new';
  } else if (daysSinceLastOrder <= 90) {
    segment = 'active';
  } else if (total_spent >= 500 && total_orders >= 5) {
    segment = 'vip';
  } else if (daysSinceLastOrder <= 180) {
    segment = 'at_risk';
  } else {
    segment = 'churned';
  }

  await db.query(
    'UPDATE customers SET segment = $1 WHERE id = $2',
    [segment, customerId]
  );
}
```

#### Customer Activity Logging

**Table:**
```sql
CREATE TABLE customer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  type VARCHAR(100) NOT NULL,  -- 'order_placed', 'review_submitted', etc.
  payload JSONB,                -- Flexible data structure
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Logging Examples:**

```javascript
// Order placed
await logActivity(customerId, 'order_placed', {
  order_id: '...',
  total: 123.45,
  items_count: 3
});

// Review submitted
await logActivity(customerId, 'review_submitted', {
  product_id: '...',
  rating: 5,
  comment: '...'
});

// Cart viewed (for abandoned cart campaigns)
await logActivity(customerId, 'cart_viewed', {
  items: [{ product_id, name, price }],
  cart_total: 89.99
});
```

### 5. Inventory Management

#### Inventory Adjustments

**Table:**
```sql
CREATE TABLE inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  product_id UUID NOT NULL REFERENCES products(id),
  delta INTEGER NOT NULL,           -- Positive or negative
  reason VARCHAR(50) NOT NULL,      -- 'manual' | 'restock' | 'correction' | 'damage' | 'return'
  note TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Create Adjustment:**

```javascript
exports.adjustInventory = async (req, res, next) => {
  const { storeId } = req.params;
  const { product_id, delta, reason, note } = req.body;

  // Validate
  if (!product_id || delta === undefined) {
    return res.status(400).json({ error: 'product_id and delta required' });
  }

  const validReasons = ['manual', 'restock', 'correction', 'damage', 'return'];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({ error: 'Invalid reason' });
  }

  try {
    // Transaction: log + update stock atomically
    const result = await db.transaction(async (client) => {
      // Check product exists
      const product = await client.query(
        'SELECT stock FROM products WHERE id = $1 AND store_id = $2',
        [product_id, storeId]
      );

      if (product.rows.length === 0) {
        throw new Error('Product not found');
      }

      const newStock = product.rows[0].stock + delta;

      if (newStock < 0) {
        throw new Error('Cannot reduce stock below 0');
      }

      // Log adjustment
      const adjustment = await client.query(
        `INSERT INTO inventory_adjustments 
         (store_id, product_id, delta, reason, note, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [storeId, product_id, delta, reason, note, req.user.userId]
      );

      // Update product stock
      await client.query(
        'UPDATE products SET stock = $1 WHERE id = $2',
        [newStock, product_id]
      );

      return adjustment.rows[0];
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

### 6. Discount Management

#### Discount Code Model

```sql
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  code VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL,        -- 'percent' | 'fixed'
  value DECIMAL(10, 2) NOT NULL,    -- 10 (for 10% or $10)
  min_subtotal DECIMAL(10, 2) DEFAULT 0,  -- Minimum order amount
  max_uses INTEGER,                  -- NULL = unlimited
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, code)
);
```

**Create Discount Code:**

```javascript
exports.createCode = async (req, res, next) => {
  const { storeId } = req.params;
  const { code, type, value, min_subtotal, max_uses, expires_at } = req.body;

  // Validate
  if (!code || !type || !value) {
    return res.status(400).json({ error: 'code, type, value required' });
  }

  if (!['percent', 'fixed'].includes(type)) {
    return res.status(400).json({ error: 'type must be percent or fixed' });
  }

  if (type === 'percent' && (value < 0 || value > 100)) {
    return res.status(400).json({ error: 'percent must be 0-100' });
  }

  try {
    const result = await db.query(
      `INSERT INTO discount_codes 
       (store_id, code, type, value, min_subtotal, max_uses, expires_at, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [storeId, code.toUpperCase(), type, value, min_subtotal || 0, max_uses, expires_at]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
```

**Validate Code (Public):**

```javascript
exports.validateCode = async (req, res, next) => {
  const { storeId } = req.params;
  const { code, subtotal } = req.body;

  try {
    const result = await db.query(
      `SELECT id, type, value, min_subtotal, used_count, max_uses 
       FROM discount_codes
       WHERE store_id = $1 AND code = $2 AND active = true
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [storeId, code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    const discount = result.rows[0];

    // Check minimum
    if (subtotal < discount.min_subtotal) {
      return res.status(400).json({
        error: `Minimum order ${discount.min_subtotal} required`
      });
    }

    // Check usage
    if (discount.max_uses && discount.used_count >= discount.max_uses) {
      return res.status(400).json({ error: 'Code limit reached' });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percent') {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    return res.json({
      success: true,
      data: {
        code,
        type: discount.type,
        value: discount.value,
        amount: discountAmount
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### 7. Product Reviews

#### Review Model

```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  product_id UUID NOT NULL REFERENCES products(id),
  customer_phone VARCHAR(20),           -- Anonymous reviews allowed
  author_name VARCHAR(255) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending' | 'approved' | 'hidden'
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product 
ON product_reviews(product_id, status);
```

#### Review Moderation Workflow

```
Customer submits review
        ↓
[pending] - awaiting admin approval
        ↓
admin reviews → [approved] or [hidden]
        ↓
if [approved]: visible on product page
if [hidden]:   not displayed
```

**Submit Review (Public):**

```javascript
exports.createReview = async (req, res, next) => {
  const { storeId } = req.params;
  const { product_id, author_name, rating, comment, customer_phone } = req.body;

  // Validate
  if (!product_id || !author_name || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1-5' });
  }

  try {
    // Check verified purchase (if customer_phone provided)
    let verifiedPurchase = false;

    if (customer_phone) {
      const purchase = await db.query(
        `SELECT EXISTS(
          SELECT 1 FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN customers c ON o.customer_id = c.id
          WHERE c.phone LIKE '%' || $1
          AND o.store_id = $2
          AND oi.product_id = $3
        ) as verified`,
        [customer_phone.slice(-4), storeId, product_id]
      );

      verifiedPurchase = purchase.rows[0].verified;
    }

    // Create review (pending approval)
    const result = await db.query(
      `INSERT INTO product_reviews 
       (store_id, product_id, customer_phone, author_name, rating, comment, verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [storeId, product_id, customer_phone, author_name, rating, comment, verifiedPurchase]
    );

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Review submitted. Awaiting approval.'
    });
  } catch (error) {
    next(error);
  }
};
```

**Get Reviews (Public/Admin):**

```javascript
// Public view - only approved reviews
exports.getPublicReviews = async (req, res, next) => {
  const { storeId, productId } = req.params;

  const result = await db.query(
    `SELECT author_name, rating, comment, verified_purchase, created_at
     FROM product_reviews
     WHERE store_id = $1 AND product_id = $2 AND status = 'approved'
     ORDER BY created_at DESC`,
    [storeId, productId]
  );

  return res.json({ success: true, data: result.rows });
};

// Admin view - all reviews with status
exports.getAdminReviews = async (req, res, next) => {
  const { storeId } = req.params;

  const result = await db.query(
    `SELECT * FROM product_reviews
     WHERE store_id = $1
     ORDER BY status DESC, created_at DESC`,
    [storeId]
  );

  return res.json({ success: true, data: result.rows });
};
```

**Approve/Moderate Review (Admin):**

```javascript
exports.updateReviewStatus = async (req, res, next) => {
  const { storeId, reviewId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'approved', 'hidden'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await db.query(
      `UPDATE product_reviews
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND store_id = $3
       RETURNING *`,
      [status, reviewId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
```

### 8. Dashboard Analytics

#### Dashboard Metrics

**Endpoint:** `GET /api/dashboard/:storeId`

**Implementation** [backend/services/DashboardService.js](backend/services/DashboardService.js):

```javascript
static async getMetrics(storeId) {
  const metrics = {};

  // 1. Total Revenue
  const revenueResult = await db.query(
    `SELECT COALESCE(SUM(total), 0) as total_revenue
     FROM orders
     WHERE store_id = $1 AND status != 'cancelled'`,
    [storeId]
  );
  metrics.totalRevenue = revenueResult.rows[0].total_revenue;

  // 2. Active Orders (pending, confirmed, shipped)
  const activeOrdersResult = await db.query(
    `SELECT COUNT(*) FROM orders
     WHERE store_id = $1 AND status IN ('pending', 'confirmed', 'shipped')`,
    [storeId]
  );
  metrics.activeOrders = activeOrdersResult.rows[0].count;

  // 3. Low Stock Alerts (stock <= 5 and active)
  const lowStockResult = await db.query(
    `SELECT COUNT(*) FROM products
     WHERE store_id = $1 AND stock <= 5 AND status = 'active'`,
    [storeId]
  );
  metrics.lowStockAlerts = lowStockResult.rows[0].count;

  // 4. Total Customers
  const customersResult = await db.query(
    `SELECT COUNT(*) FROM customers WHERE store_id = $1`,
    [storeId]
  );
  metrics.totalCustomers = customersResult.rows[0].count;

  // 5. Recent Orders (last 5 with customer names)
  const recentOrdersResult = await db.query(
    `SELECT o.id, o.order_number, o.total, o.status, o.created_at, c.name as customer_name
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.store_id = $1
     ORDER BY o.created_at DESC
     LIMIT 5`,
    [storeId]
  );
  metrics.recentOrders = recentOrdersResult.rows;

  return metrics;
}
```

**Response Example:**
```json
{
  "totalRevenue": 12450.50,
  "activeOrders": 7,
  "lowStockAlerts": 3,
  "totalCustomers": 142,
  "recentOrders": [
    {
      "id": "...",
      "order_number": "ORD-1684756199000",
      "total": 124.50,
      "status": "pending",
      "created_at": "2026-05-20T10:30:00Z",
      "customer_name": "John Doe"
    }
  ]
}
```

---

## Data Model & Database

### Entity Relationship Diagram

```
users (1) ──── (many) user_roles (many) ──── (1) stores
  │
  └──── (many) ai_insights

stores (1) ──── (many) {
  - categories ──── (many) products
  - products ──── (many) {
      - order_items
      - product_reviews
      - inventory_adjustments
    }
  - customers ──── (many) {
      - orders ──── (many) order_items
      - customer_activities
      - ai_insights
    }
  - discount_codes
  - ai_insights
}
```

### Complete Schema

**Users & Authentication:**
```sql
-- Global user accounts
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store access control (multi-tenant)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,  -- 'owner' | 'admin' | 'staff'
  UNIQUE(user_id, store_id)
);
```

**Stores & Core:**
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  UNIQUE(store_id, slug)
);
```

**Products & Inventory:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

CREATE INDEX products_store_status_idx 
ON products(store_id, status);

CREATE TABLE inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL,
  note TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_adj_store 
ON inventory_adjustments(store_id, created_at DESC);
```

**Orders & Customers:**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  segment VARCHAR(50) DEFAULT 'new',
  notes TEXT,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, phone)
);

CREATE INDEX idx_customers_store 
ON customers(store_id);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  discount_code VARCHAR(50),
  notes TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_store 
ON orders(store_id, status);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10, 2) NOT NULL
);

CREATE TABLE customer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Reviews & Discounts:**
```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20),
  author_name VARCHAR(255) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product 
ON product_reviews(product_id, status);

CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  min_subtotal DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, code)
);
```

**AI Insights:**
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  kind VARCHAR(50) NOT NULL,
  summary TEXT,
  next_action TEXT,
  email_subject VARCHAR(255),
  email_body TEXT,
  recommendations JSONB,
  model VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_store 
ON ai_insights(store_id, created_at DESC);
```

---

## API Reference

### Authentication

```
POST   /auth/register
  Body: { email, password, name }
  Response: { user: { id, email, name }, token }

POST   /auth/login
  Body: { email, password }
  Response: { user, token }

GET    /auth/me
  Headers: Authorization: Bearer <token>
  Response: { user }
```

### Stores

```
POST   /stores
  Create new store (authenticated users)
  
GET    /stores
  List user's accessible stores

GET    /stores/:id
  Get store details

PUT    /stores/:id
  Update store (owner only)
  
DELETE /stores/:id
  Delete store (owner only)
```

### Products

```
GET    /products/:storeId
GET    /products/:storeId?active=true

POST   /products/:storeId
  Body: { name, slug, description, price, stock, category_id }

GET    /products/:storeId/:id

PUT    /products/:storeId/:id
  Body: (any product fields to update)

DELETE /products/:storeId/:id

POST   /products/:storeId/upload
  Multipart: file
  Response: { imageUrl }

GET    /products/:storeId/slug/:slug
  Public lookup by slug
```

### Orders

```
POST   /products/:storeId/checkout (PUBLIC)
  Body: {
    customer: { name, phone, email },
    items: [{ product_id, quantity }],
    shipping_address: { ... },
    discount_code: "CODE",
    notes: "..."
  }

GET    /orders/:storeId (ADMIN)

GET    /orders/:storeId/:id (ADMIN)

PATCH  /orders/:storeId/:id/status (ADMIN)
  Body: { status }

POST   /orders/:storeId/lookup (PUBLIC)
  Body: { order_number, phone }
```

### Customers

```
GET    /customers/:storeId

GET    /customers/:storeId/:id

PUT    /customers/:storeId/:id
  Body: { name, email, notes, segment }

GET    /customers/:storeId/:id/activities

POST   /customers/:storeId/:id/activities
  Body: { type, payload }
```

### Discounts

```
GET    /discounts/:storeId

POST   /discounts/:storeId
  Body: { code, type, value, min_subtotal, max_uses, expires_at }

POST   /discounts/:storeId/validate (PUBLIC)
  Body: { code, subtotal }
  Response: { discountAmount }

DELETE /discounts/:storeId/:id
```

### Reviews

```
GET    /reviews/:storeId?status=pending

POST   /reviews/:storeId (PUBLIC)
  Body: { product_id, author_name, rating, comment, customer_phone }

PUT    /reviews/:storeId/:id/status (ADMIN)
  Body: { status }

DELETE /reviews/:storeId/:id
```

### Inventory

```
GET    /inventory/:storeId
  Get adjustment history

POST   /inventory/:storeId/adjust (STAFF+)
  Body: { product_id, delta, reason, note }
```

### AI & Demand

```
GET    /ai/:storeId/customer/:customerId

POST   /ai/:storeId/customer/:customerId/generate

GET    /ai/:storeId/reengagement

GET    /ai/:storeId/recent-insights

GET    /ai/:storeId/demand-history

POST   /ai/:storeId/demand (ADMIN+)
  Body: { idea, targetPrice }
```

### Dashboard

```
GET    /dashboard/:storeId
  Response: {
    totalRevenue,
    activeOrders,
    lowStockAlerts,
    totalCustomers,
    recentOrders: [...]
  }
```

---

## Authentication & Security

### JWT Implementation

**Token Structure:**
```
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId, email, role, iat, exp }
Signature: HMAC-SHA256(header + payload, JWT_SECRET)
```

**Token Lifespan:**
- Created at login/registration
- Valid for 7 days (can be extended in .env)
- Stored in browser localStorage
- Sent in Authorization header for each request
- Auto-refreshed on valid response (future enhancement)

### Password Security

**Backend (bcryptjs):**
```javascript
// Hashing (registration)
const hash = await bcryptjs.hash(password, 10);  // 10 salt rounds

// Verification (login)
const isValid = await bcryptjs.compare(password, storedHash);
```

**Never:**
- Store plain-text passwords
- Send passwords in API responses
- Log passwords in errors

### Multi-Tenant Isolation

**Enforcement:**
1. Every query filters by `store_id`
2. User must have role in `user_roles` table for that store
3. Middleware checks `user_id + store_id` combination
4. Cannot access another user's store

**Example:**
```javascript
// User A cannot access User B's store
GET /products/store-b-id
// Checked against: user_roles WHERE user_id = A AND store_id = store-b-id
// Result: 403 Access Denied
```

---

## Key Code Patterns

### Transaction Pattern (Atomic Operations)

**Problem:** Multiple updates must succeed together or all roll back

**Solution:**
```javascript
const result = await db.transaction(async (client) => {
  // All operations use client, not db
  const order = await client.query('INSERT INTO orders...', [...]);
  await client.query('UPDATE products...', [...]);
  await client.query('INSERT INTO order_items...', [...]);
  return order;
});
// If any throws error, all changes roll back automatically
```

### Multi-Tenant Query Pattern

**Always include `store_id` filter:**
```javascript
// Good
SELECT * FROM products WHERE store_id = $1

// Bad (could expose other stores' data)
SELECT * FROM products WHERE category_id = $1
```

### Slug Uniqueness Pattern

**Problem:** URLs like `/product/phone-stand` should be unique per store, not globally

**Solution:**
```sql
UNIQUE(store_id, slug)
-- Allows:
-- Store A: /products/phone-stand
-- Store B: /products/phone-stand (different store)
```

### Error Handling Middleware

**Backend:**
```javascript
// Catch all errors and format response
app.use((error, req, res, next) => {
  console.error(error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});
```

---

## Environment Setup

### Local Development

**Prerequisites:**
- Node.js 18+
- PostgreSQL 12+ running
- Git

**Steps:**
```bash
git clone <repo>
cd smartstore-ai

npm install
cd backend && npm install && cd ..

# Create database
createdb smartstore_ai

# Run migrations
cd backend && node scripts/run_migrations.js && cd ..

# Start servers
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Database: localhost:5432

### Production Deployment

**Backend (Node.js + Express):**
1. Set `NODE_ENV=production`
2. Use process manager (PM2, systemd)
3. Enable HTTPS/SSL
4. Set strong `JWT_SECRET`
5. Database: Managed PostgreSQL (AWS RDS, Heroku, etc.)
6. Uploads: Cloud storage (S3, Cloudinary)

**Frontend (React + Vite):**
1. Build: `npm run build`
2. Output: `dist/` folder
3. Deploy to CDN (Netlify, Vercel, Cloudflare Pages)
4. Set `VITE_BACKEND_URL` to production API

---

## Feature Status & Roadmap

### Current Status (MVP)

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Complete | JWT + bcryptjs |
| Product Catalog | ✅ Complete | Full CRUD, image upload |
| Order Processing | ✅ Complete | Checkout, lookup, status tracking |
| Inventory | ✅ Complete | Stock management, adjustment history |
| Customer Mgmt | ✅ Complete | Profiles, segmentation, activity |
| Discounts | ✅ Complete | Codes, validation, usage limits |
| Reviews | ✅ Complete | Verified purchase, moderation |
| Dashboard | ✅ Complete | 5 key metrics |
| AI Demand Scoring | ⚠️ MVP | Simulated (65-95), ready for real API |
| AI Customer Analysis | ⚠️ MVP | Simulated insights |
| Email Campaigns | 🔲 Deferred | Schema ready, no impl |
| CRM/Pipeline | 🔲 Deferred | Schema ready, no impl |
| Analytics | ✅ Basic | Dashboard + reporting |
| Multi-Store | ✅ Complete | Full multi-tenancy |

### Planned Enhancements

1. **Real AI Integration** (Phase 2)
   - OpenAI GPT-4 / Google Gemini API
   - Custom ML models for demand scoring
   - Market data integration

2. **Advanced Features** (Phase 3)
   - Email automation
   - SMS notifications
   - Social media integration
   - Advanced reporting/BI

3. **Performance** (Phase 2)
   - Caching layer (Redis)
   - Database optimization
   - CDN integration for images

4. **Mobile App** (Phase 3)
   - React Native / Flutter
   - Push notifications

---

## Support & Next Steps

### How to Use This Documentation

1. **Understanding the System**: Start with this document from top to bottom
2. **Implementing Features**: Reference the specific feature section
3. **Debugging Issues**: Check the relevant code sections for logic
4. **Deploying**: Follow Environment Setup → Production Deployment

### Common Tasks

**Add a new product field:**
1. Add column to `products` table
2. Update `Product.js` model
3. Update API endpoint validation
4. Update frontend form

**Change discount calculation:**
1. Edit `discountController.validateCode()`
2. Update formula in checkout logic
3. Test with sample codes

**Create new API endpoint:**
1. Add route file in `backend/routes/`
2. Create controller function
3. Add middleware (auth, validation)
4. Document in this file

---

**Document Version:** 1.0  
**Last Updated:** May 20, 2026  
**Maintained By:** SmartStore AI Development Team
