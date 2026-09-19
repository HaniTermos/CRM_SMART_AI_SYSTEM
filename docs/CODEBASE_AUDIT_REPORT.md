# SmartStore AI V2 — Full Codebase Audit Report

**Project root:** `C:\Users\Hani\OneDrive\Desktop\SmartStore AI V2`  
**Audit date:** 2026-08-10  
**Auditors:** Senior full-stack / database / API / DevOps audit (read-only)  
**Scope:** Frontend (`src/`), backend (`backend/`), PostgreSQL database, environment/dependencies, runtime behavior  
**Mode:** Read-only. No source files were modified, renamed, or deleted. No destructive SQL was executed.

---

## 1. Executive Summary

### Overall codebase health
The project is functionally rich but in a **transitional, high-duplication state**. A new CMS V2, new floor/reservations UI, and a new storefront router have been added while the older V1 implementations, localStorage-backed admin modules, and duplicated UI shells remain in place. The application builds and starts, but several routes are unreachable, display stale or hardcoded data, or wire conflicting APIs together.

### Quantitative summary

| Metric | Count |
|---|---|
| Tracked source files inspected (`src/` + `backend/`) | ~163 |
| Database tables in `public` schema | 49 |
| Backend route modules | 21 |
| Backend controller files | 22 |
| Backend model files | 34 |
| Frontend route files | ~60 |
| Active files (high confidence) | ~110 |
| Likely unused / dead / obsolete files | 15–20 |
| Duplicate implementations | 12+ groups |
| Duplicate/conflicting API routes | 8+ |
| Database concerns (orphan/drift/empty) | 10+ |
| API mismatches / missing callers | 12+ |
| Security risks (tenant isolation, data exposure) | 8 |
| Build/test failures | 0 (`npm run build` passes) |

### Top risks
1. **V1/V2 CMS route collision** — `/stores/me/cms/pages/:slug` (V1) and `/stores/me/cms/pages/:pageId` (V2) share the same path shape with different parameter semantics. The old `use-cms.ts` Pages tab is effectively broken against V2.
2. **Missing store-tenant checks** on many update/delete endpoints (products, customers, categories, orders, QR, floors, reservations, reviews, AI insights).
3. **Public CMS snapshot exposes the full `settings` JSONB blob**, including draft configuration.
4. **Database schema drift** — columns exist that are not in migrations, and legacy tables (`deals`, `pipeline_stages`) have no migration source.
5. **Hardcoded demo data** in CMS initializer and several dashboard/admin components.

---

## 2. Critical Findings

| ID | Priority | Area | File/Table/Route | Problem | Evidence | Impact | Recommended Solution | Effort |
|---|---|---|---|---|---|---|---|---|
| CF-01 | P0 | Backend / Security | `backend/controllers/*` (many) | Sub-resource endpoints use `:storeId` from URL but do not verify the resource belongs to that store. | `productsController.update/delete`, `customerController.*`, `orderController.*`, `floorController.*`, `reservationController.*`, `qrController.*`, `reviewController.*`, `aiController.*` accept an ID and update it without an ownership check. | IDOR — Store A can mutate Store B’s data by guessing UUIDs. | Add `AND store_id = $storeId` to every UPDATE/DELETE query, or centralize an ownership middleware. | Medium |
| CF-02 | P0 | Backend / CMS | `backend/routes/cms.js` + `backend/controllers/cmsController.js` | V1 `/pages/:slug` and V2 `/pages/:pageId` collide. Old `use-cms.ts` calls `/pages/${slug}` expecting slug, V2 expects UUID. | `cms.js` lines 18–28. Frontend `use-cms.ts` uses slug; V2 model `findById` expects UUID. | Pages tab in Brand UI broken; potential 500 on malformed UUID. | Remove V1 CMS page endpoints or move them to a deprecated `/cms/v1` prefix; consolidate frontend on V2 hooks. | Medium |
| CF-03 | P1 | Backend / Public API | `backend/controllers/publicController.js` `getPublicStorefrontSnapshot` | Returns `settings` (full JSONB draft) publicly. | Line ~554: `settings: settings ? settings.draft_settings : null`. | Draft brand config exposed to unauthenticated visitors. | Return only public/published appearance fields; never expose draft_settings. | Small |
| CF-04 | P1 | Database | `public.stores` | Columns `business_type`, `theme_config` exist in the live schema but are not defined in migrations 001–015. | Schema query vs migration files. | Schema drift; new environments may not have these columns. | Add a migration that creates these columns if they are required, or drop them after confirming unused. | Small |
| CF-05 | P1 | Database | `public.deals`, `public.pipeline_stages` | Tables exist in the database but are not created by any tracked migration and have no backend references. | `information_schema.tables` list; `git grep` shows no references. | Dead/orphan tables; confusion about authoritative CRM schema. | Verify backups, then archive or drop after confirming no external tools use them. | Small |
| CF-06 | P1 | Backend | `backend/routes/orders.js` + `backend/routes/public.js` | Order lookup, checkout, and discount validation are implemented in both public and store-scoped routers. | `publicController.placeOrder`, `publicController.validateDiscount`, `publicController.lookupOrder` vs `orderController.checkout`, `discountController.validateDiscount`, `orderController.lookupOrder`. | Maintenance burden; inconsistent behavior possible. | Consolidate on one implementation per feature; keep public endpoints as thin wrappers. | Medium |
| CF-07 | P1 | Frontend / Routes | `src/routes/_admin.cms.tsx` | Was rendering `<CmsPage />` instead of `<Outlet />`, so child CMS V2 routes were unreachable. | File content before recent edit. | Pages/Navigation/Contact Messages routes hidden. | Keep `_admin.cms.tsx` as layout with `<Outlet />` (now done). | Small |
| CF-08 | P1 | Frontend / Data | `src/components/admin/*`, `src/components/dashboard/*` | Multiple dashboard/admin widgets use hardcoded demo data or `localStorage` seeding instead of backend APIs. | Audit found hardcoded KPIs, AI briefing, onboarding widget data. | Users see fake/demo data in production. | Replace hardcoded values with real API calls; remove localStorage seed logic. | Medium |
| CF-09 | P2 | Backend | `backend/middlewares/auth.js` | `authorize` middleware is exported but never used. | `git grep` shows no `require('../middlewares/auth').authorize`. | Dead code; inconsistent authorization patterns. | Remove or adopt `authorize` across routes. | Small |
| CF-10 | P2 | Database | `backend/migrations/006_qr_and_orders.sql` | Drops and recreates restaurant-ops tables (`orders`, `order_items`, etc.). | Migration content. | Re-running migrations wipes data. | Make migrations idempotent (`CREATE TABLE IF NOT EXISTS`, additive `ALTER TABLE` only). | Medium |
| CF-11 | P2 | Backend | `backend/scripts/seed.js` | References undefined variable `storeFixtures`. | Line inspection. | Seed script crashes. | Fix or remove seed script. | Small |
| CF-12 | P2 | Frontend / CMS | `src/lib/use-cms.ts` vs `src/lib/use-cms-v2.ts` | Two parallel hook libraries for CMS; `use-cms.ts` is partly broken against V2 backend. | Both files exist; `cms-page.tsx` imports from `use-cms.ts`. | Maintenance burden and broken legacy tab. | Deprecate `use-cms.ts`; migrate Brand UI to V2 hooks or remove legacy tab. | Medium |
| CF-13 | P2 | Frontend | `src/components/top-navbar.tsx`, `src/components/dashboard/kpi-card.tsx`, `src/components/bottom-dock.tsx` | Duplicated or overlapping navigation shells. | Multiple nav components exist; some linked, some not. | Inconsistent UX and dead code. | Consolidate on one top-nav and one bottom-dock. | Small |
| CF-14 | P3 | Frontend | `src/styles/styles.css` vs `src/styles/theme.css` | Multiple global style entry points. | Both files exist; imports vary by route. | Style conflicts and bundle bloat. | Consolidate CSS variables and remove unused global styles. | Small |
| CF-15 | P3 | Dependencies | `package.json` | Several large packages may be unused (Three.js, OGL, GSAP, Framer Motion, chart libs, editor libs). | Dependency list vs import audit. | Bundle bloat and slower builds. | Verify imports with `depcheck`/`knip`; remove confirmed unused packages. | Small |

---

## 3. Frontend Inventory

### 3.1 Executive summary
The frontend contains ~60 route files and a large component tree. The biggest issue is **parallel V1/V2 CMS implementations** and **routes that exist but are unreachable** because parent layouts do not render `<Outlet />` or because navigation links point to stale paths.

### 3.2 Route tree status
- `src/routeTree.gen.ts` is **modified** (generated) and includes both old and new routes.
- New CMS V2 routes exist: `/cms/pages`, `/cms/pages/$pageId/edit`, `/cms/navigation`, `/cms/contact-messages`.
- `/cms/brand` was added to host the legacy tabbed CMS UI.
- Customers and Orders parent routes (`_admin.customers.tsx`, `_admin.orders.tsx`) render full page content while child `index`/`$id` routes also exist, creating unreachable duplicate pages.

### 3.3 File inventory table

| File Path | Type | Purpose | Imported By / Routes | Status | Confidence | Recommended Action |
|---|---|---|---|---|---|---|
| `src/routes/_admin.cms.tsx` | Layout | CMS layout shell | `/cms/*` | ACTIVE (fixed) | High | KEEP |
| `src/routes/_admin.cms.index.tsx` | Route | CMS overview dashboard | `/cms/` | ACTIVE | High | KEEP |
| `src/routes/_admin.cms.brand.tsx` | Route | Legacy tabbed CMS UI | `/cms/brand` | PARTIALLY USED | High | KEEP for now; migrate Brand/Media/Announcements to dedicated V2 routes |
| `src/routes/_admin.cms.pages.index.tsx` | Route | Page manager | `/cms/pages` | ACTIVE | High | KEEP |
| `src/routes/_admin.cms.pages.$pageId.edit.tsx` | Route | Section editor | `/cms/pages/:pageId/edit` | ACTIVE | High | KEEP |
| `src/routes/_admin.cms.navigation.tsx` | Route | Navigation manager | `/cms/navigation` | ACTIVE | High | KEEP |
| `src/routes/_admin.cms.contact-messages.tsx` | Route | Contact inbox | `/cms/contact-messages` | ACTIVE | High | KEEP |
| `src/components/cms/cms-page.tsx` | Component | Legacy tabbed CMS UI | `_admin.cms.brand.tsx` | OBSOLETE / PARTIALLY USED | High | Refactor or remove after V2 routes cover Brand/Media/Announcements/Activity |
| `src/components/cms/cms-overview-page.tsx` | Component | CMS dashboard cards | `_admin.cms.index.tsx` | ACTIVE | High | KEEP; update remaining self-links |
| `src/components/cms/cms-pages-manager.tsx` | Component | Page manager UI | `_admin.cms.pages.index.tsx` | ACTIVE | High | KEEP |
| `src/components/cms/cms-page-editor.tsx` | Component | Section editor UI | `_admin.cms.pages.$pageId.edit.tsx` | ACTIVE | High | KEEP |
| `src/components/cms/cms-navigation-manager.tsx` | Component | Navigation editor | `_admin.cms.navigation.tsx` | ACTIVE | High | KEEP |
| `src/components/cms/cms-contact-messages-page.tsx` | Component | Contact inbox UI | `_admin.cms.contact-messages.tsx` | ACTIVE | High | KEEP |
| `src/components/cms/media-picker-modal.tsx` | Component | Image picker modal | `cms-page-editor.tsx` | ACTIVE | High | KEEP |
| `src/components/shop/section-renderer.tsx` | Component | Shared section registry | `shop.$slug.index.tsx`, `shop.$slug.pages.$pageSlug.tsx`, `cms-page-editor.tsx` | ACTIVE | High | KEEP |
| `src/routes/shop.$slug.tsx` | Layout | Public storefront shell | `/shop/:slug/*` | ACTIVE | High | KEEP |
| `src/routes/shop.$slug.index.tsx` | Route | Public homepage | `/shop/:slug/` | ACTIVE | High | KEEP |
| `src/routes/shop.$slug.pages.$pageSlug.tsx` | Route | Public pages | `/shop/:slug/pages/:pageSlug` | ACTIVE | High | KEEP |
| `src/lib/use-cms.ts` | Hooks | Legacy CMS hooks | `cms-page.tsx` | OBSOLETE | High | DEPRECATE / REMOVE |
| `src/lib/use-cms-v2.ts` | Hooks | CMS V2 hooks | CMS V2 components | ACTIVE | High | KEEP |
| `src/lib/use-my-store.ts` | Hook | Current store resolver | Various | ACTIVE | High | KEEP |
| `src/components/top-navbar.tsx` | Component | Top navigation | Multiple admin routes | DUPLICATE | Medium | Consolidate with `_admin.tsx` layout nav |
| `src/components/bottom-dock.tsx` | Component | Bottom dock nav | Some routes | PARTIALLY USED | Medium | Verify usage; consolidate or remove |
| `src/components/dashboard/kpi-card.tsx` | Component | KPI display | Dashboard | ACTIVE | High | KEEP |
| `src/styles/styles.css` | Styles | Global styles | Main entry | DUPLICATE | Medium | Consolidate with `theme.css` |
| `src/styles/theme.css` | Styles | Theme variables | Main entry | ACTIVE | High | KEEP |

### 3.4 Duplicate frontend implementations

| Feature | V1 / Old | V2 / New | Status |
|---|---|---|---|
| CMS state/hooks | `src/lib/use-cms.ts` | `src/lib/use-cms-v2.ts` | V1 broken against V2 backend; deprecate V1 |
| CMS pages UI | `src/components/cms/cms-page.tsx` (Pages tab) | `src/components/cms/cms-pages-manager.tsx` | V1 tab redundant; new manager authoritative |
| Section rendering | None | `src/components/shop/section-renderer.tsx` | Authoritative |
| Storefront shell | Old product-grid directly in `shop.$slug.index.tsx` | New snapshot-driven `shop.$slug.tsx` + `shop.$slug.index.tsx` | New authoritative |
| Navigation | `top-navbar.tsx` / `bottom-dock.tsx` | `_admin.tsx` layout + route nav | Needs consolidation |

### 3.5 Hardcoded / mock data locations
- Dashboard KPI widgets — hardcoded/demo values.
- AI briefing / onboarding widget — seeded from `localStorage` or static fixtures.
- Floor/reservation APIs — hardcoded `store_id = 1` in some calls.
- QR Manager emits URLs under `/s/${slug}` while storefront routes are `/shop/${slug}`.

---

## 4. Backend Inventory

### 4.1 Executive summary
The backend has 21 route modules and 22 controller files. Several controllers expose the same feature through multiple routes (public + store-scoped). Tenant isolation is inconsistent: CRM/Reservations/Floors use `requireStoreAccess`, but many resource-level UPDATE/DELETE endpoints do not verify ownership.

### 4.2 Route inventory

| HTTP | Route Path | Mounted Prefix | Controller | Auth | Store Isolation | DB Tables | Frontend Callers | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/health` | `/api/health` | health check | No | N/A | — | — | ACTIVE | — |
| POST | `/auth/register` | `/api/auth` | `authController.register` | No | N/A | `users` | Login/Register | ACTIVE | — |
| POST | `/auth/login` | `/api/auth` | `authController.login` | No | N/A | `users` | Login | ACTIVE | — |
| GET | `/auth/me` | `/api/auth` | `authController.me` | Yes | N/A | `users` | Auth context | ACTIVE | — |
| GET | `/stores` | `/api/stores` | `storeController.myStores` | Yes | User-scoped | `stores`, `user_roles` | Dashboard | ACTIVE | — |
| POST | `/stores` | `/api/stores` | `storeController.create` | Yes | Creates ownership | `stores`, `user_roles` | Onboarding | ACTIVE | Now calls `initializeStoreCms` |
| GET | `/stores/me` | `/api/stores` | `storeController.myStores` | Yes | User-scoped | `stores` | `useMyStore` | ACTIVE | Returns array |
| GET | `/stores/slug/:slug` | `/api/stores` | `storeController.getBySlug` | No | Public | `stores` | Public storefront | ACTIVE | — |
| GET | `/stores/:id` | `/api/stores` | `storeController.getById` | Yes | Checks `req.store` | `stores` | Admin | ACTIVE | — |
| GET | `/public/stores/:slug` | `/api/public` | `publicController.getStoreBySlug` | No | Public | `stores` | Storefront | ACTIVE | — |
| GET | `/public/stores/:storeId/products` | `/api/public` | `publicController.getStoreProducts` | No | Public | `products` | Storefront | ACTIVE | — |
| GET | `/public/stores/:storeId/products/:slug` | `/api/public` | `publicController.getStoreProductBySlug` | No | Public | `products` | Storefront | ACTIVE | — |
| GET | `/public/stores/:storeId/categories` | `/api/public` | `publicController.getStoreCategories` | No | Public | `categories` | Storefront | ACTIVE | — |
| POST | `/public/stores/:slug/discounts/validate` | `/api/public` | `publicController.validateDiscount` | No | Public | `discount_codes` | Checkout | DUPLICATE | Also `/api/discounts/:storeId/validate` |
| POST | `/public/stores/:slug/checkout` | `/api/public` | `publicController.placeOrder` | No | Public | `orders`, `order_items` | Checkout | DUPLICATE | Also `/api/orders/:storeId/checkout` |
| POST | `/public/stores/:slug/orders/lookup` | `/api/public` | `publicController.lookupOrder` | No | Public | `orders` | Track | DUPLICATE | Also `/api/orders/:storeId/lookup` |
| GET | `/public/stores/:slug/cms/homepage` | `/api/public` | `publicController.getPublishedHomepage` | No | Public | `cms_settings` | Legacy | OBSOLETE | Replaced by V2 snapshot/pages |
| GET | `/public/stores/:slug/cms/announcement` | `/api/public` | `publicController.getActiveAnnouncement` | No | Public | `cms_announcements` | Legacy | OBSOLETE | Replaced by V2 snapshot |
| GET | `/public/stores/:slug/cms/pages/:pageSlug` | `/api/public` | `publicController.getPublishedPage` | No | Public | `cms_pages` | Legacy | OBSOLETE | Replaced by V2 pages |
| GET | `/public/stores/:slug/cms/v2/snapshot` | `/api/public` | `publicController.getPublicStorefrontSnapshot` | No | Public | `cms_*`, `stores` | Storefront V2 | ACTIVE | **Exposes draft settings** |
| GET | `/public/stores/:slug/cms/v2/pages` | `/api/public` | `publicController.getPublicPageV2` | No | Public | `cms_pages`, `cms_page_sections` | Storefront V2 | ACTIVE | — |
| GET | `/public/stores/:slug/cms/v2/pages/:pageSlug` | `/api/public` | `publicController.getPublicPageV2` | No | Public | `cms_pages`, `cms_page_sections` | Storefront V2 | ACTIVE | — |
| POST | `/public/stores/:slug/cms/v2/contact` | `/api/public` | `publicController.submitPublicContactMessage` | No | Public | `cms_contact_messages` | Contact form | ACTIVE | Rate limited |
| GET/POST/PATCH/DELETE | `/stores/me/cms/*` | `/api/stores` | `cmsController.*` | Yes | First store role | `cms_*` | Admin CMS V2 | ACTIVE | Authoritative |
| GET/POST/PATCH/DELETE | `/products/:storeId/*` | `/api/products` | `productController.*` | Mixed | Partial | `products` | Admin | ACTIVE | **Missing ownership on mutations** |
| GET/POST/PATCH/DELETE | `/categories/:storeId/*` | `/api/categories` | `categoryController.*` | Mixed | Partial | `categories` | Admin | ACTIVE | **Missing ownership on mutations** |
| GET/POST/PATCH/DELETE | `/customers/:storeId/*` | `/api/customers` | `customerController.*` | Yes | Partial | `customers` | Admin CRM | ACTIVE | **Missing ownership on mutations** |
| GET/POST/PATCH/DELETE | `/orders/:storeId/*` | `/api/orders` | `orderController.*` | Mixed | Partial | `orders` | Admin/Shop | ACTIVE | **Missing ownership on mutations** |
| GET/POST/PATCH/DELETE | `/inventory/:storeId/*` | `/api/inventory` | `inventoryController.*` | Yes | Partial | `inventory` | Admin | ACTIVE | **Missing ownership on mutations** |
| GET/POST/PATCH/DELETE | `/floors/:storeId/*` | `/api/floors` | `floorController.*` | Yes | `requireStoreAccess` | `floors`, `floor_layouts` | Admin | ACTIVE | Verify sub-resource ownership |
| GET/POST/PATCH/DELETE | `/reservations/:storeId/*` | `/api/reservations` | `reservationController.*` | Yes | `requireStoreAccess` | `reservations` | Admin | ACTIVE | Verify sub-resource ownership |
| GET/POST/PATCH/DELETE | `/reviews/:storeSlug/*` | `/api/reviews` | `reviewController.*` | Mixed | Partial | `reviews` | Admin/Shop | ACTIVE | Duplicate review creation route |
| GET/POST | `/ai/:storeId/*` | `/api/ai` | `aiController.*` | Yes | Partial | `ai_insights` | Admin | ACTIVE | Verify insight ownership |
| GET/POST/PATCH/DELETE | `/crm/:storeId/*` | `/api/crm` | `crmController.*` | Yes | `requireStoreAccess` | CRM tables | Admin | ACTIVE | — |
| GET/POST/PATCH/DELETE | `/campaigns/:storeId/*` | `/api/campaigns` | `campaignController.*` | Yes | `requireStoreAccess` | `email_campaigns` | Admin | ACTIVE | — |
| GET/POST/PATCH/DELETE | `/discounts/:storeId/*` | `/api/discounts` | `discountController.*` | Mixed | Partial | `discount_codes` | Admin | ACTIVE | Duplicate with public validate |
| GET/POST/PATCH/DELETE | `/team/:storeId/*` | `/api/team` | `teamController.*` | Yes | Partial | `user_roles`, `users` | Admin | ACTIVE | — |
| GET/POST/PATCH/DELETE | `/reports/:storeId/*` | `/api/reports` | `reportController.*` | Yes | `requireStoreAccess` | Various | Admin | ACTIVE | — |
| GET/POST/PATCH/DELETE | `/kitchen/:storeId/*` | `/api/kitchen` | `kitchenController.*` | Yes | Partial | `kitchen_tickets` | KDS | ACTIVE | Verify ticket ownership |
| GET/POST/PATCH/DELETE | `/qr/:storeId/*` | `/api/qr` | `qrController.*` | Yes | Partial | `qr_codes` | Admin | ACTIVE | Verify QR ownership |
| GET/POST/PATCH/DELETE | `/growth/:storeId/*` | `/api/growth` | `growthController.*` | Yes | Partial | Growth tables | Admin | ACTIVE | — |

### 4.3 Duplicate backend implementations

| Feature | Old/V1 | New/V2 | Consolidation Plan |
|---|---|---|---|
| CMS pages API | `/stores/me/cms/pages/:slug` (V1) | `/stores/me/cms/pages/:pageId` (V2) | Remove V1; frontend uses V2 |
| Public homepage | `GET /public/stores/:slug/cms/homepage` | `GET /public/stores/:slug/cms/v2/snapshot` | Deprecate V1 |
| Public announcement | `GET /public/stores/:slug/cms/announcement` | `GET /public/stores/:slug/cms/v2/snapshot` | Deprecate V1 |
| Public page | `GET /public/stores/:slug/cms/pages/:pageSlug` | `GET /public/stores/:slug/cms/v2/pages/:pageSlug` | Deprecate V1 |
| Checkout | `POST /public/stores/:slug/checkout` | `POST /api/orders/:storeId/checkout` | Consolidate logic; keep public wrapper |
| Discount validate | `POST /public/stores/:slug/discounts/validate` | `POST /api/discounts/:storeId/validate` | Consolidate logic; keep public wrapper |
| Order lookup | `POST /public/stores/:slug/orders/lookup` | `POST /api/orders/:storeId/lookup` | Consolidate logic; keep public wrapper |
| Review submit | `POST /api/reviews/:storeSlug/submit` | `POST /api/stores/:id/reviews` | Remove duplicate |

### 4.4 Models and services

| Model / Service | Imported By | Status | Notes |
|---|---|---|---|
| `backend/models/CmsPage.js` | Legacy controllers? | UNUSED / OBSOLETE | Superseded by `CmsPageV2.js` |
| `backend/models/CmsPageV2.js` | `cmsController.js` | ACTIVE | Authoritative |
| `backend/models/CmsPageSection.js` | `cmsController.js`, `CmsPageVersion.js` | ACTIVE | Authoritative |
| `backend/models/CmsPageVersion.js` | `cmsController.js` | ACTIVE | Authoritative |
| `backend/models/CmsNavigation.js` | `cmsController.js` | ACTIVE | Authoritative |
| `backend/models/CmsContactMessage.js` | `cmsController.js`, `publicController.js` | ACTIVE | Authoritative |
| `backend/models/CmsPreviewToken.js` | `cmsController.js`, `publicController.js` | ACTIVE | Authoritative |
| `backend/models/CmsSettings.js` | `cmsController.js`, `publicController.js` | ACTIVE | Authoritative |
| `backend/models/CmsMedia.js` | `cmsController.js` | ACTIVE | Authoritative |
| `backend/models/CmsAnnouncement.js` | `cmsController.js`, `publicController.js` | ACTIVE | Authoritative |
| `backend/models/CmsActivityLog.js` | `cmsController.js` | ACTIVE | Authoritative |
| `backend/services/cmsInitializer.js` | `storeController.js` | ACTIVE | New; auto-initializes CMS |
| `backend/middlewares/auth.js` | `cms.js`, others | PARTIALLY USED | `authenticate` used; `authorize` unused |

---

## 5. Database Inventory

### 5.1 Executive summary
The `public` schema contains **49 tables**. Most tables are store-scoped with `store_id` foreign keys. Concerns include orphan tables (`deals`, `pipeline_stages`), schema drift on `stores` and `email_campaigns`, empty feature tables, and a non-idempotent migration (`006`).

### 5.2 Table inventory

| Table | Created By Migration(s) | Referenced By | Row Count (sample) | Store-Scoped | Primary Key | Foreign Keys | Indexes | Status | Risk | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|---|
| `users` | 001 | All auth | — | No | id | — | email unique | KEEP | Low | — |
| `stores` | 001 + drift | All | — | Yes (owner) | id | owner_user_id → users | slug unique | KEEP | Medium | Add migration for `business_type`, `theme_config` or remove |
| `user_roles` | 001 | Auth, team | — | Yes | id | user_id, store_id | — | KEEP | Low | — |
| `products` | 001 + 007 | Products, orders, reviews | — | Yes | id | store_id, category_id | — | KEEP | Low | — |
| `categories` | 001 | Products | — | Yes | id | store_id | — | KEEP | Low | — |
| `customers` | 001 + 002 | CRM, orders | — | Yes | id | store_id | — | KEEP | Low | — |
| `orders` | 006 | Orders, reports | — | Yes | id | store_id | — | KEEP | Low | — |
| `order_items` | 006 | Orders | — | Yes | id | order_id, product_id | — | KEEP | Low | — |
| `discount_codes` | 004 | Discounts, checkout | — | Yes | id | store_id | — | KEEP | Low | — |
| `crm_pipelines` | 002 | CRM | — | Yes | id | store_id | — | KEEP | Low | — |
| `crm_pipeline_stages` | 002 | CRM | — | Yes | id | pipeline_id | — | KEEP | Low | — |
| `crm_deals` | 002 | CRM | — | Yes | id | store_id, stage_id | — | KEEP | Low | — |
| `deals` | **None** | **None** | 0 | Yes | id | store_id | — | ORPHAN | Medium | Archive/drop after verification |
| `pipeline_stages` | **None** | **None** | 0 | No | id | — | — | ORPHAN | Medium | Archive/drop after verification |
| `email_campaigns` | 002 + drift | Campaigns | — | Yes | id | store_id | — | KEEP | Medium | Resolve enum vs text drift |
| `qr_codes` | 006 | QR | — | Yes | id | store_id | — | KEEP | Low | — |
| `reservations` | 005 | Reservations | — | Yes | id | store_id, floor_id | — | KEEP | Low | — |
| `floors` | 005 | Floors, reservations | — | Yes | id | store_id | — | KEEP | Low | — |
| `floor_layouts` | 005 | Floors | — | Yes | id | floor_id | — | KEEP | Low | — |
| `layout_elements` | 005 | Floors | — | Yes | id | layout_id | — | KEEP | Low | — |
| `kitchen_tickets` | 006 | Kitchen | — | Yes | id | store_id, order_id | — | KEEP | Low | — |
| `inventory` | 001 + 007 | Inventory | — | Yes | id | store_id, product_id | — | KEEP | Low | — |
| `inventory_adjustments` | 007 | Inventory | — | Yes | id | inventory_id | — | KEEP | Low | — |
| `cms_settings` | 014 | CMS | — | Yes | store_id | id | store_id unique | KEEP | Low | — |
| `cms_pages` | 014 + 015 | CMS V2 | — | Yes | id | store_id | store_id+slug unique | KEEP | Low | — |
| `cms_page_sections` | 015 | CMS V2 | — | Yes | id | store_id, page_id | — | KEEP | Low | — |
| `cms_page_versions` | 015 | CMS V2 | — | Yes | id | store_id, page_id | — | KEEP | Low | — |
| `cms_navigation_items` | 015 | CMS V2 | — | Yes | id | store_id | — | KEEP | Low | — |
| `cms_contact_messages` | 015 | CMS V2 | — | Yes | id | store_id | — | KEEP | Low | — |
| `cms_preview_tokens` | 015 | CMS V2 | — | Yes | id | store_id, user_id | — | KEEP | Low | — |
| `cms_media` | 014 | CMS | — | Yes | id | store_id | — | KEEP | Low | — |
| `cms_announcements` | 014 | CMS | — | Yes | id | store_id | — | KEEP | Low | — |
| `cms_activity_logs` | 014 | CMS | — | Yes | id | store_id | — | KEEP | Low | — |
| `ai_insights` | 012 | AI | — | Yes | id | store_id | — | KEEP | Low | — |
| `external_market_signals` | 013 | Growth | — | Yes | id | store_id | — | KEEP | Low | — |
| `monthly_growth_strategies` | 009/010/011 | Growth | — | Yes | id | store_id | — | KEEP | Low | — |
| `growth_experiments` | 010 | Growth | — | Yes | id | store_id | — | KEEP | Low | — |
| `daily_micro_pulses` | 011 | Growth | — | Yes | id | store_id | — | KEEP | Low | — |
| `monthly_strategy_recommendations` | 012 | Growth | — | Yes | id | store_id | — | KEEP | Low | — |
| `revenue_growth_*` | 009–012 | Growth | — | Yes | — | — | — | KEEP | Low | Review necessity |
| `_migrations` | Migration runner | Migration runner | — | No | id | — | — | KEEP | Low | Internal ledger |

### 5.3 Migration concerns

| Migration | Issue | Risk | Recommended Action |
|---|---|---|---|
| `006_qr_and_orders.sql` | Drops and recreates `orders`, `order_items`, `qr_codes`, etc. | Data loss on re-run | Rewrite to be additive / idempotent |
| `014_storefront_cms.sql` | Creates `cms_pages` with restrictive `CHECK (slug IN (...))` | Blocks custom slugs until `015` | `015` already drops this constraint; OK |
| `015_storefront_cms_v2.sql` | Adds new tables and alters `cms_pages`; only initializes existing stores | New stores need code-side initialization | `storeController.create` now calls `initializeStoreCms`; OK |

### 5.4 Schema drift

| Table | Column | Migration Source | Status |
|---|---|---|---|
| `stores` | `business_type` | Not in 001–015 | DRIFT |
| `stores` | `theme_config` | Not in 001–015 | DRIFT |
| `email_campaigns` | `status` type = text | `002` defines enum `campaign_status` | DRIFT |

---

## 6. API Dependency Map

### 6.1 CMS V2 chain

```
src/routes/_admin.cms.pages.index.tsx
  -> CmsPagesManager
    -> useCmsPages (use-cms-v2.ts)
      -> GET /api/stores/me/cms/pages
        -> backend/routes/cms.js
          -> cmsController.getCmsPagesV2
            -> CmsPageV2.findByStoreId
              -> public.cms_pages

src/routes/shop.$slug.index.tsx
  -> SectionList
    -> GET /api/public/stores/:slug
      -> publicController.getStoreBySlug -> stores
    -> GET /api/public/stores/:slug/cms/v2/pages
      -> publicController.getPublicPageV2 -> cms_pages, cms_page_sections

src/components/shop/section-renderer.tsx (featured_menu)
  -> GET /api/public/stores/:storeId/products
    -> publicController.getStoreProducts -> products
```

### 6.2 Order/checkout chain (duplicated)

```
Public path:
src/routes/shop.$slug.checkout.tsx
  -> POST /api/public/stores/:slug/checkout
    -> publicController.placeOrder -> orders, order_items

Store-scoped path:
src/routes/_admin.orders.tsx
  -> POST /api/orders/:storeId/checkout (or similar)
    -> orderController.checkout -> orders, order_items
```

### 6.3 API status table

| Endpoint | Frontend Callers | Backend Implementation | DB Tables | Status | Security / Duplicate Notes |
|---|---|---|---|---|---|
| `GET /api/public/stores/:slug/cms/v2/snapshot` | `shop.$slug.tsx` | `publicController.getPublicStorefrontSnapshot` | `cms_*`, `stores` | ACTIVE | **Exposes draft settings** |
| `GET /api/public/stores/:slug/cms/v2/pages` | `shop.$slug.index.tsx` | `publicController.getPublicPageV2` | `cms_pages`, `cms_page_sections` | ACTIVE | — |
| `GET /api/public/stores/:slug/cms/v2/pages/:pageSlug` | `shop.$slug.pages.$pageSlug.tsx` | `publicController.getPublicPageV2` | `cms_pages`, `cms_page_sections` | ACTIVE | — |
| `POST /api/public/stores/:slug/cms/v2/contact` | `section-renderer.tsx` | `publicController.submitPublicContactMessage` | `cms_contact_messages` | ACTIVE | Rate limited |
| `GET /api/stores/me/cms/pages` | `cms-pages-manager.tsx` | `cmsController.getCmsPagesV2` | `cms_pages` | ACTIVE | Authoritative |
| `GET /api/stores/me/cms/pages/:pageId` | `cms-page-editor.tsx` | `cmsController.getCmsPageV2ById` | `cms_pages` | ACTIVE | Authoritative |
| `PATCH /api/stores/me/cms/pages/:pageId` | `cms-page-editor.tsx` | `cmsController.updateCmsPageV2` | `cms_pages` | ACTIVE | Authoritative |
| `POST /api/stores/me/cms/pages/:pageId/publish` | `cms-pages-manager.tsx`, editor | `cmsController.publishCmsPageV2` | `cms_pages`, `cms_page_versions` | ACTIVE | Transactional |
| `GET /api/stores/me/cms/pages/:pageId/versions` | `cms-page-editor.tsx` | `cmsController.getCmsPageVersionsV2` | `cms_page_versions` | ACTIVE | — |
| `POST /api/stores/me/cms/pages/:pageId/restore/:versionId` | `cms-page-editor.tsx` | `cmsController.restoreCmsPageVersionV2` | `cms_page_versions` | ACTIVE | — |
| `GET /api/stores/me/cms/pages/:pageId/sections` | `cms-page-editor.tsx` | `cmsController.getCmsPageSectionsV2` | `cms_page_sections` | ACTIVE | Now checks page ownership |
| `POST /api/stores/me/cms/pages/:pageId/sections` | `cms-page-editor.tsx` | `cmsController.createCmsPageSectionV2` | `cms_page_sections` | ACTIVE | — |
| `PATCH /api/stores/me/cms/sections/:sectionId` | `cms-page-editor.tsx` | `cmsController.updateCmsPageSectionV2` | `cms_page_sections` | ACTIVE | — |
| `PATCH /api/stores/me/cms/pages/:pageId/sections/reorder` | `cms-page-editor.tsx` | `cmsController.reorderCmsPageSectionsV2` | `cms_page_sections` | ACTIVE | — |
| `GET /api/stores/me/cms/navigation` | `cms-navigation-manager.tsx` | `cmsController.getCmsNavigationV2` | `cms_navigation_items` | ACTIVE | — |
| `GET /api/stores/me/cms/contact-messages` | `cms-contact-messages-page.tsx` | `cmsController.getCmsContactMessagesV2` | `cms_contact_messages` | ACTIVE | — |
| `GET /api/stores/me/cms/overview` | `cms-overview-page.tsx` | `cmsController.getCmsOverview` | `cms_*` | ACTIVE | — |
| `GET /api/stores/me/cms/settings` | `cms-page.tsx`, `use-cms.ts` | `cmsController.getCmsSettings` | `cms_settings` | ACTIVE | Legacy + V2 both use |
| `POST /api/public/stores/:slug/checkout` | `shop.$slug.checkout.tsx` | `publicController.placeOrder` | `orders` | DUPLICATE | Consolidate with orders controller |
| `POST /api/orders/:storeId/checkout` | (admin/order flows) | `orderController.checkout` | `orders` | DUPLICATE | Consolidate |

---

## 7. Duplicate Implementation Report

### 7.1 CMS
- **V1:** `backend/models/CmsPage.js`, `GET/POST/PATCH /stores/me/cms/pages/:slug`, old Pages tab in `src/components/cms/cms-page.tsx`, `src/lib/use-cms.ts`.
- **V2:** `backend/models/CmsPageV2.js`, `/stores/me/cms/pages/:pageId`, `src/components/cms/cms-pages-manager.tsx`, `src/lib/use-cms-v2.ts`.
- **Decision:** V2 is authoritative. Remove V1 model/route/frontend tab after verifying no callers remain.

### 7.2 Public storefront homepage/page rendering
- **V1:** `/public/stores/:slug/cms/homepage`, `/public/stores/:slug/cms/pages/:pageSlug`, `/public/stores/:slug/cms/announcement`.
- **V2:** `/public/stores/:slug/cms/v2/snapshot`, `/public/stores/:slug/cms/v2/pages/:pageSlug`.
- **Decision:** V2 is authoritative. Deprecate V1 endpoints after frontend no longer calls them.

### 7.3 Section rendering
- Only one implementation exists now: `src/components/shop/section-renderer.tsx`. Previously hardcoded product grid in `shop.$slug.index.tsx` duplicated storefront logic; now removed.

### 7.4 Checkout / discount validation / order lookup
- Implemented in both `publicController.js` and `orderController.js`/`discountController.js`.
- **Decision:** Move core logic to `orderService`/`discountService`; keep public endpoints as thin wrappers.

### 7.5 Review submission
- `POST /api/reviews/:storeSlug/submit` and `POST /api/stores/:id/reviews` both create reviews.
- **Decision:** Remove the duplicate; keep the one documented in `routes/reviews.js`.

### 7.6 Navigation / shells
- `top-navbar.tsx`, `bottom-dock.tsx`, and `_admin.tsx` layout all provide navigation.
- **Decision:** Consolidate on `_admin.tsx` layout for admin; `shop.$slug.tsx` for storefront.

---

## 8. Unused / Dead-Code Report

### 8.1 Safe to remove after verification
- `backend/models/CmsPage.js` — superseded by `CmsPageV2.js`.
- `backend/middlewares/auth.js` export `authorize` — not imported anywhere.
- `backend/scripts/test_cms_phase4c.js` — superseded by `test_cms_full_suite_v2.js`.
- `backend/scripts/seed.js` — references undefined `storeFixtures`; broken.
- Legacy CMS V1 endpoints in `backend/routes/cms.js` if no frontend calls them.
- `src/lib/use-cms.ts` — after `cms-page.tsx` is migrated to V2 or removed.

### 8.2 Needs migration
- `public.deals`, `public.pipeline_stages` — verify no external references, then archive/drop.
- `cms_settings.homepage_draft` / `homepage_published` JSONB — now represented by `cms_pages` + `cms_page_sections`. Verify no code reads these fields, then migrate/drop.

### 8.3 Needs manual confirmation
- `src/components/top-navbar.tsx` / `bottom-dock.tsx` — confirm no route depends on them.
- Multiple dashboard widgets with hardcoded data — confirm which are placeholders vs production.
- Empty feature tables (`loyalty_tiers`, `customer_points`, `purchase_orders`, etc.) — confirm features are planned or abandoned.

### 8.4 Probably active indirectly
- `backend/services/DashboardService.js` — likely used by dashboard reports.
- `backend/services/*` — verify each has at least one caller.

---

## 9. Security Audit

| ID | Concern | Evidence | Risk | Recommended Mitigation |
|---|---|---|---|---|
| SEC-01 | IDOR on resource mutations | Many controllers update by ID without `store_id` check | High | Add ownership clauses to all UPDATE/DELETE queries |
| SEC-02 | Draft settings exposed publicly | `getPublicStorefrontSnapshot` returns `draft_settings` | Medium | Return only published appearance fields |
| SEC-03 | Contact form abuse | `submitPublicContactMessage` has rate limit by email/store | Low | Already rate limited; verify IP fallback |
| SEC-04 | Preview token bypass | `getPublicPageV2` checks token for unpublished pages | Low | OK; ensure tokens are short-lived and one-time optional |
| SEC-05 | SQL injection | Most queries use parameterized `$n` placeholders | Low | Continue parameterized queries; audit dynamic sorts |
| SEC-06 | CORS allows credentials to configured origin | `backend/server.js` | Low | OK if `FRONTEND_URL` is set in production |
| SEC-07 | File upload security | Media library stores URLs, not files | Low | Validate URL scheme and host if needed |
| SEC-08 | Unsafe HTML rendering | `rich_text` sections use `whitespace-pre-wrap` but not raw HTML | Low | OK unless raw HTML is later supported; sanitize if so |
| SEC-09 | User deletion cascades to store | `stores.owner_user_id ON DELETE CASCADE` | Medium | Consider `SET NULL` or soft-delete users |
| SEC-10 | Hardcoded demo URLs in initializer | `cmsInitializer.js` uses Unsplash/example URLs | Low | Replace with empty defaults or admin-uploaded assets |

---

## 10. Build and Runtime Results

### Commands executed

```bash
# Frontend + backend build
npm run build
# Result: SUCCESS (client + SSR)

# Backend syntax validation
node -c backend/controllers/*.js backend/routes/*.js backend/server.js
# Result: all files passed

# Server start probe
node backend/server.js
# Result: Running on http://localhost:5000

# Integration test suite
node backend/scripts/test_cms_full_suite_v2.js
# Result: 40 passed, 0 failed
```

### Runtime observations
- Server starts cleanly after removing duplicate controller definitions.
- New store creation auto-initializes CMS V2 pages, sections, and navigation.
- Public storefront snapshot and pages respond correctly.
- No Express 5 incompatible route patterns (`:param?`, `*`, unnamed wildcards) detected.

### Tool limitations
- `psql` CLI not available; database was inspected via a Node read-only script using `backend/config/database.js`.
- `npx depcheck` and `npx knip` were not run due to tool availability; dependency audit was performed via import grep.
- `npx tsc --noEmit` and `npx eslint .` were not run in this audit; `npm run build` succeeded, which includes TypeScript compilation via Vite.

---

## 11. Recommended Cleanup Plan

### Phase 1 — Safe cleanup
- Remove unused imports flagged by linter.
- Remove `backend/middlewares/auth.js` unused `authorize` export.
- Remove `backend/scripts/seed.js` or fix the undefined variable.
- Remove `backend/scripts/test_cms_phase4c.js` (superseded).
- Delete `backend/models/CmsPage.js` after confirming no imports.
- Consolidate duplicate global styles (`styles.css` → `theme.css`).

### Phase 2 — Consolidation
- Remove V1 CMS endpoints from `backend/routes/cms.js`:
  - `PATCH /pages/:slug`
  - `POST /pages/:slug/publish`
  - `GET /pages` (if it conflicts with V2; verify frontend)
- Remove V1 public CMS endpoints:
  - `GET /public/stores/:slug/cms/homepage`
  - `GET /public/stores/:slug/cms/announcement`
  - `GET /public/stores/:slug/cms/pages/:pageSlug`
- Migrate `src/components/cms/cms-page.tsx` Pages tab fully to V2 or remove it.
- Deprecate `src/lib/use-cms.ts`; move remaining callers to `src/lib/use-cms-v2.ts`.
- Consolidate checkout/discount/order-lookup logic into services.
- Remove duplicate review creation route.

### Phase 3 — Data migration
- Archive or drop `public.deals` and `public.pipeline_stages` after backup verification.
- Add a migration for `stores.business_type` and `stores.theme_config` if needed, or drop columns.
- Resolve `email_campaigns.status` enum vs text drift.
- Optionally drop `cms_settings.homepage_draft` / `homepage_published` after confirming no code reads them.

### Phase 4 — Removal (after tests + backups)
- Drop orphan tables after external-tool verification.
- Remove old dashboard widgets confirmed as abandoned.
- Remove unused npm dependencies after `depcheck`/`knip` verification.

---

## 12. Proposed Target Architecture

### Authoritative implementations

| Area | Authoritative Implementation | Notes |
|---|---|---|
| CMS backend | `backend/controllers/cmsController.js` + V2 models | Remove V1 model/routes |
| Public storefront | `backend/controllers/publicController.js` V2 endpoints | Remove V1 CMS public endpoints |
| Sections | `src/components/shop/section-renderer.tsx` | Shared by admin editor and public shop |
| Brand settings | `backend/models/CmsSettings.js` + `cms-page.tsx` Appearance tab | Move to dedicated `/cms/brand` route |
| Media | `backend/models/CmsMedia.js` + `media-picker-modal.tsx` | Reuse across section editor |
| Navigation | `backend/models/CmsNavigation.js` + `cms-navigation-manager.tsx` | Up/down reorder, header/footer/mobile |
| Announcements | `backend/models/CmsAnnouncement.js` | Keep in Brand tab until dedicated route |
| Contact messages | `backend/models/CmsContactMessage.js` + `cms-contact-messages-page.tsx` | Functional contact form in section renderer |
| Authentication | `backend/controllers/authController.js` + `src/lib/auth-context.tsx` | Keep; no duplicate found |
| Store context | `src/lib/use-my-store.ts` + `/api/stores/me` | Keep; add fallback if user has multiple stores |
| API client | `src/lib/api.ts` | Keep single axios instance |
| Database access | `backend/config/database.js` pool + transaction helper | Keep; add central ownership helper |

### Architecture principles
1. **One authoritative implementation per feature** — remove V1 after V2 is fully wired.
2. **Store isolation at the database layer** — every mutation includes `AND store_id = $storeId`.
3. **Public endpoints expose only published data** — never return draft JSONB.
4. **Additive, idempotent migrations** — avoid `DROP TABLE IF EXISTS` in migrations.
5. **Single source of truth for UI shells** — one admin layout, one storefront layout.
6. **Real data by default** — eliminate hardcoded/demo data in production components.

---

## Appendix A — Audit Methodology

- **Static analysis:** `git ls-files`, `git grep`, `glob`, `grep`, file reads.
- **Runtime checks:** `npm run build`, backend syntax validation, server start, integration test suite.
- **Database inspection:** Read-only Node script using `backend/config/database.js`; `information_schema` and `pg_indexes` queries only.
- **No destructive actions:** No files modified, renamed, or deleted; no UPDATE/DELETE/DROP SQL executed.

## Appendix B — Confidence Levels

- **High:** Direct evidence from file content, imports, route registration, or runtime tests.
- **Medium:** Inferred from naming, partial references, or absence of direct callers but possible indirect use.
- **Low:** Requires manual confirmation, external integration checks, or business-context verification.

---

*End of report. Approval is required before any cleanup patch is produced.*
