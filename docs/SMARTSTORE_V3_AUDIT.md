# SmartStore AI V3 — Architecture Audit

**Project root:** `C:\Users\Hani\OneDrive\Desktop\SmartStore AI V2`  
**Audit date:** 2026-08-10  
**Scope:** Frontend, backend, PostgreSQL schema, CMS V2, public storefront, themes, dashboard, operational pages.

---

> **Update:** Phases 29-34 (themes, AI builder, publishing safety, contact-form analytics) were completed after this audit. See `docs/CMS_PROGRESS_REPORT.md` for details.

## 1. Current Architecture

### 1.1 Frontend

- **Framework:** TanStack Start (Vite + React 19 + file-based TanStack Router + SSR).
- **Styling:** Tailwind CSS v4 with `@theme` blocks in `src/styles.css` / `src/styles/theme.css`.
- **State management:** React Query (TanStack Query) for server state, local React state for local UI, `zustand` available but unused.
- **Auth:** `src/lib/auth-context.tsx` stores JWT in `localStorage` (`smartstore_token`).
- **Store context:** `src/lib/use-my-store.ts` fetches `/api/stores/me` and returns the first store.
- **API client:** `src/lib/api.ts` (single axios instance).
- **Routing layout:** `src/routes/_admin.tsx` wraps all dashboard pages with `TopNavbar`, `AdminSidebar`, `BottomDock`, `FloatingAIV3`, and `AnimatedBackground`.
- **CMS V2 surface:** `src/routes/admin/cms/*` and `src/lib/use-cms-v2.ts`.
- **Public storefront:** `src/routes/shop.$slug.tsx` + `src/components/shop/section-renderer.tsx`.
- **Marketing/system pages:** `src/routes/index.tsx` (homepage) and other public marketing routes rendered under the same root layout.

### 1.2 Backend

- **Framework:** Express 5.2.1, port `5000`.
- **Entry:** `backend/server.js` mounts all feature routers.
- **Auth middleware:** `backend/middlewares/auth.js` (`authenticate`, `requireStoreAccess`).
- **Database:** PostgreSQL via `backend/config/database.js`.
- **Models:** One class per table, plain SQL via `db.query`.
- **Services:** `DashboardService`, `AiService`, `GrowthEngineService`, `orderService`, `discountService`, etc.
- **Tests:** Integration scripts in `backend/scripts/` (no Jest/Vitest).

### 1.3 Route mounting (server.js)

| Mount path | Router |
|---|---|
| `/api/auth` | auth |
| `/api/public` | public storefront |
| `/api/stores` | stores |
| `/api/products/:storeId` | products |
| `/api/categories/:storeId` | categories |
| `/api/customers/:storeId` | customers |
| `/api/crm/:storeId` | CRM |
| `/api/campaigns/:storeId` | campaigns |
| `/api/orders/:storeId` | orders |
| `/api/reports/:storeId` | reports |
| `/api/ai/:storeId` | AI insights |
| `/api/discounts/:storeId` | discount codes |
| `/api/reviews/:storeSlug` | reviews |
| `/api/inventory/:storeId` | inventory |
| `/api/team/:storeId` | team |
| `/api/floors/:storeId` | floors |
| `/api/reservations/:storeId` | reservations |
| `/api/kitchen/:storeId` | kitchen tickets |
| `/api/qr/:storeId` | QR codes |
| `/api/stores/me/growth` | growth engine |
| `/api/stores/:storeId/growth` | growth engine |
| `/api/stores/me/cms` | CMS V2 |
| `/api/stores/:storeId/cms` | CMS V2 |

### 1.4 Dashboard navigation

- `src/lib/nav-config.ts` is now the single source of truth for sidebar, bottom dock, and More menu.
- `src/lib/nav-layout-context.tsx` syncs `navMode` (`dock` | `sidebar`) with the user's `user_preferences.nav_mode`.
- `src/components/admin-sidebar.tsx`, `src/components/bottom-dock.tsx`, and `src/components/top-navbar.tsx` consume the shared registry.

### 1.5 Theme system

- `src/components/theme-provider.tsx` now provides a `DashboardThemeProvider` that scopes the dashboard theme to `[data-app-scope="dashboard"]` and persists it via `/api/users/me/preferences`.
- Marketing pages (`/`, `/about-smartstore`, `/pricing`, `/compare`, `/contact`) and the public storefront (`/shop/:slug`) are isolated from the dashboard dark mode.
- Storefront theme still comes from `cms_settings` (`primary_color`, `accent_color`, `font_family`, `theme_mode`, etc.) applied inline on the storefront root `div` in `src/routes/shop.$slug.tsx`.

### 1.6 CMS V2 data model

- `cms_settings` — brand/appearance + legacy `homepage_draft` / `homepage_published`.
- `cms_pages` — system and custom pages (slug, title, status, SEO, navigation visibility, published version).
- `cms_page_sections` — modular sections per page (type, position, visibility, content/layout/appearance/background/responsive JSONB).
- `cms_page_versions` — snapshot-based versioning.
- `cms_navigation_items` — header/footer/mobile nav.
- `cms_announcements` — scheduled/active banners.
- `cms_media` — URL-only media library.
- `cms_contact_messages` — public contact form submissions.
- `cms_preview_tokens` — secure draft preview tokens.

### 1.7 Public storefront rendering

- `GET /api/public/stores/:slug/cms/v2/snapshot` returns store, appearance, announcement, navigation.
- `GET /api/public/stores/:slug/cms/v2/pages` renders the `home` page.
- `GET /api/public/stores/:slug/cms/v2/pages/:pageSlug` renders any published page.
- `src/components/shop/section-renderer.tsx` maps section `type` to React components.
- Only `published` pages/sections are returned publicly; preview tokens unlock drafts.

---

## 2. Known Bugs

### 2.1 Layout / responsive

- `src/routes/_admin.tsx` uses `md:pl-64 pb-12` in sidebar mode, but `TopNavbar` spans the full width including the sidebar area. On desktop the main content is offset, but the sidebar itself overlaps the fixed top navbar content because the navbar content is centered with `max-w-7xl` rather than being inset to the sidebar.
- The dashboard main content uses `max-w-7xl` and `mx-auto`, which causes horizontal whitespace and can make wide pages (Reports, CMS editor) feel cramped.
- CMS editor `src/components/cms/cms-page-editor.tsx` renders **inside** `_admin.tsx` dashboard shell. It is not full-screen; it uses `h-[calc(100vh-4rem)]`, leaving the top navbar and dashboard padding visible. This does **not** meet the V3 full-screen editor requirement.
- Bottom dock is hardcoded to hide in sidebar mode and show in dock mode; there is no mobile-first responsive behavior (drawer, safe-area, etc.).

### 2.2 Theme leakage ✅ Fixed

- `DashboardThemeProvider` now scopes the dark class to the dashboard container. Marketing and storefront pages no longer inherit dashboard theme.

### 2.3 Reservations page ✅ Rewired

- `src/routes/_admin.reservations.tsx` now uses `useMyStore()` for the real store UUID and treats IDs as strings.
- List view fetches a single date + status; calendar view fetches the full month range via `dateFrom`/`dateTo`.
- Added migration `019_reservations_indexes_and_date_range.sql` with indexes on `store_id + date`, `status`, `time`, etc.
- Floor/table picker now uses the correct store-scoped `/floors/${storeId}/${floorId}` endpoint.

### 2.4 Menu Manager ✅ Rewired

- `src/routes/_admin.menu.tsx` now uses `/api/categories/:storeId` and `/api/products/:storeId` for full CRUD, duplicate, bulk update, category reorder, and image upload.
- New product fields (`prep_time`, `is_available`, `is_featured`, `dietary_tags`, `allergens`, `modifiers`) were added via migration `018_menu_manager_enhancements.sql`.
- `src/lib/menu-db.ts` is no longer used by the menu route (retained only until all references are removed).
- QR preview now displays the real store slug; actual QR generation remains tracked in 2.8.

### 2.5 Kitchen ✅ Rewired

- `src/routes/_admin.kitchen.tsx` now fetches real kitchen tickets from `/api/kitchen/:storeId` and bumps status to `ready` via the API.
- LocalStorage seed data is no longer used by the kitchen display.

### 2.6 Reports ✅ Real data

- `src/routes/_admin.reports.tsx` renders `src/components/reports/reports-page.tsx`, which uses real backend data for KPIs, revenue chart, top products, category breakdown, and channel breakdown.
- Added backend endpoints: `GET /api/reports/:storeId/revenue-by-category`, `GET /api/reports/:storeId/sales-by-channel`, `GET /api/reports/:storeId/hourly-density`.
- Added migration `020_reports_analytics_indexes.sql` with `orders.source` column and reporting indexes.
- Hardcoded `CATEGORY_DATA` and `CHANNEL_DATA` constants removed from the frontend.

### 2.7 AI Assistant page

- `src/routes/_admin.ai.tsx` is a hardcoded chat UI that never calls the backend. Replies are static.

### 2.8 QR codes ✅ Preview fixed

- Added `GET /api/qr/:storeId/:qrId` endpoint and `qrController.getQrCodeById`.
- `src/routes/_admin.qr-manager.tsx` now opens a preview modal that fetches the saved QR record and renders its exact `target_url`.

### 2.9 Growth / AI Insights pages ✅ Created

- `src/routes/_admin.growth.tsx` and `src/routes/_admin.ai-insights.tsx` now exist and are wired to existing growth/AI endpoints.
- `/ai` chat stub is preserved but no longer the primary AI surface.

### 2.10 Notifications ✅ Implemented

- Migration `017_user_prefs_notifications_indexes.sql` added the `notifications` table.
- Backend routes/controllers exist under `/api/notifications`.
- Top navbar now shows a real notification dropdown using `/api/notifications` with unread count and read-all.
- `SettingsPage` notification settings remain localStorage-only (separate from system notifications).

### 2.11 User preferences ✅ Implemented

- Migration `017_user_prefs_notifications_indexes.sql` added the `user_preferences` table.
- `UserPreference` model, controller, and `/api/users/me/preferences` routes exist.
- `AuthService` creates default preferences on registration and returns them on login.
- Dashboard theme and nav mode now sync with `user_preferences`.

### 2.12 CMS editor UX issues

- Section inspector saves on a manual "Save Changes" button; there is no autosave or draft indicator.
- No click-to-scroll synchronization between section list and preview.
- No section variants — only section types.
- No device-specific scroll container for the preview; the whole center area scrolls.
- No unsaved-changes protection on route leave.
- "Preview" opens the public storefront in a new tab with a preview token, which is correct.

### 2.13 Public storefront data gaps

- `FeaturedMenuSection` fetches public products but does not respect filters such as "best sellers", "newest", "category", etc.
- `MapSection` is a placeholder.
- `OpeningHoursSection` relies on manually entered JSON.
- No real event/catering/reservations pages exist beyond the generic `pageSlug` renderer.

---

## 3. Hardcoded Data Locations

| File | Data type | Details |
|---|---|---|
| `src/lib/db.ts` | Orders, customers | `seedOrders()`, `seedCustomers()` stored in localStorage. Still used by `loyalty` and `customers` routes. |
| `src/lib/inventory-db.ts` | Inventory | Seed inventory data (localStorage). |
| `src/routes/_admin.ai.tsx` | AI chat | Static welcome message and static AI reply. |
| `src/components/dashboard/revenue-chart.tsx` | Revenue chart | Likely fixture data (needs verification). |
| `src/components/dashboard/live-activity.tsx` | Activity feed | Likely fixture data (needs verification). |
| `src/components/dashboard/reservations-widget.tsx` | Reservations | Needs verification. |
| `src/components/dashboard/monthly-strategy-panel.tsx` | Strategy | Likely fixture data. |
| `src/components/dashboard/today-actions-panel.tsx` | Actions | Likely fixture data. |
| `src/components/dashboard/onboarding-widget.tsx` | Onboarding | Static checklist. |
| `backend/migrations/014_storefront_cms.sql` | CMS defaults | Hardcoded Unsplash hero URLs, contact info, testimonials. |
| `backend/migrations/015_storefront_cms_v2.sql` | CMS defaults | Hardcoded hero/featured/gallery/testimonial/FAQ/contact sections for every store. |

---

## 4. Missing Backend Endpoints

### 4.1 Notifications ✅ Done

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`

### 4.2 User preferences ✅ Done

- `GET /api/users/me/preferences`
- `PATCH /api/users/me/preferences`

### 4.3 QR preview ✅ Done

- `GET /api/qr/:storeId/:qrId` (load single saved QR record)

### 4.4 Menu Manager ✅ Done

- `GET /api/products/:storeId` and `GET /api/categories/:storeId` (existing, now used)
- `POST /api/products/:storeId` (create product)
- `PUT /api/products/:storeId/:id` (update product)
- `PATCH /api/products/:storeId/:id/duplicate`
- `PATCH /api/products/:storeId/bulk`
- `POST /api/products/:storeId/upload` (image upload)
- `POST /api/categories/:storeId` (create category)
- `PATCH /api/categories/:storeId/:id` (update category)
- `PATCH /api/categories/:storeId/reorder`
- `DELETE /api/products/:storeId/:id` and `DELETE /api/categories/:storeId/:id`

### 4.5 Reports analytics

- Revenue over time with grouping.
- Sales by channel.
- Revenue by category.
- Top products by quantity/revenue.
- New vs returning customers.
- Peak ordering hours.
- Reservation utilization.
- Discount/campaign performance.

### 4.6 Growth page

- `GET /api/stores/me/growth/metrics` (growth KPIs)

### 4.7 AI Insights page

- `GET /api/stores/me/ai-insights` (dashboard list)

### 4.8 CMS AI ✅ Done

- `POST /api/stores/me/cms/ai/generate-website`
- `POST /api/stores/me/cms/ai/edit-page`
- `POST /api/stores/me/cms/ai/apply-plan`

Implemented in `backend/services/AiService.js` and `backend/controllers/cmsController.js`; UI added to CMS Studio overview and page editor toolbar.

---

## 5. Missing Database Tables

| Table | Status | Needed for | Suggested schema additions |
|---|---|---|---|
| `user_preferences` | ✅ Created | Dashboard theme, nav density, reduced motion, default date range | `id, user_id, dashboard_theme, nav_mode, density, reduced_motion, default_date_range, default_page, created_at, updated_at` |
| `notifications` | ✅ Created | Functional notifications | `id, store_id, user_id, type, title, message, severity, link, is_read, created_at` |
| `product_modifiers` / `modifier_options` | Partial (JSONB) | Real modifiers on products | `products.modifiers` JSONB column added in migration 018. Dedicated tables deferred. |
| `product_tags` / `product_allergens` | Partial (JSONB) | Dietary/allergen tags | `products.dietary_tags` and `products.allergens` JSONB arrays added in migration 018. |
| `store_business_hours` | Opening hours, holiday exceptions | `store_id, day_of_week, open_time, close_time, is_closed, valid_from, valid_to`. |
| `store_locations` | Multi-location support, map data | `store_id, name, address, lat, lng, zoom, directions_url, is_primary`. |
| `cms_faq_items` | Dedicated FAQ management | `store_id, category_id, question, answer, position, status`. |
| `cms_page_templates` | Page templates (blank, event, catering, gallery, landing) | `id, name, thumbnail, default_sections_json`. |
| `cms_themes` | Ready-made themes | `id, name, category, definition_json`. |
| `cms_theme_assignments` | Store-theme mapping | `store_id, theme_id, is_published, overrides_json`. |
| `cms_media_folders` | Media library organization | `store_id, name, parent_id`. |

---

## 6. Duplicate Implementations

| Area | Duplicates | Recommendation |
|---|---|---|
| Reports | `src/routes/_admin.reports.tsx` (localStorage) and `src/components/reports/reports-page.tsx` (backend) | Delete `_admin.reports.tsx` content and route to `ReportsPage`. |
| Top navbar | `src/components/top-navbar.tsx` and `src/components/ui/top-navbar.tsx` | Keep `src/components/top-navbar.tsx`; delete or audit `ui/top-navbar.tsx`. |
| KPI card | `src/components/dashboard/kpi-card.tsx` and `src/components/ui/kpi-card.tsx` | Keep dashboard version; delete or audit UI version. |
| CMS | `src/components/cms/cms-page.tsx` (legacy V1 Brand Studio tabs) and `src/routes/admin/cms/*` (V2) | Keep V2; deprecate V1 `cms-page.tsx` or merge only the appearance logic. |
| Theme toggles | Global `ThemeProvider` + inline storefront theme logic | Isolate into scoped providers. |

---

## 7. CMS Limitations

- **Not full-screen:** editor renders inside `_admin.tsx` dashboard shell.
- **No section variants:** only 13 basic section types with fixed layouts.
- **No section library/chooser:** "Add Section" opens a modal with a single list; no category -> variant -> preview flow.
- **No click-to-scroll sync:** selecting a section in the left panel does not scroll the preview; clicking in the preview does not scroll the section list.
- **No device-specific preview scroll container:** the center area scrolls as a whole.
- **No autosave/draft indicator:** manual save only.
- **No unsaved-changes guard:** browser/tab close can lose edits.
- **Ready-made themes ✅** — `cms_themes` table seeded with 4 presets; selector added to Brand & Appearance.
- **AI website builder ✅** — backend endpoints and UI flows for generating/editing pages.
- **Unsaved-changes guard ✅** — `useBlocker` + `beforeunload` protection in the page editor.
- **Limited public page types:** no dedicated events/catering/reservations page templates.
- **Media library is URL-only:** no upload endpoint; no folders, tags, or usage tracking beyond simple URL grep.
- **Map section is a placeholder.**
- **Opening hours manually entered as JSON.**
- **Contact form ✅** — dashboard inbox exists at `/cms/contact-messages`; analytics endpoint and stats cards added.

---

## 8. Theme Limitations

- Dashboard theme is persisted per user via `user_preferences` ✅.
- Storefront theme can now be selected from ready-made themes ✅; raw color/font overrides remain available.
- CSS scoping via `data-app-scope` is implemented for the dashboard.
- No support for theme-aware section variants.

---

## 9. Performance Risks

| Risk | Location | Impact |
|---|---|---|
| Loading all reservations without pagination | `src/routes/_admin.reservations.tsx` | Slows down as reservation history grows. |
| Loading 90 days of orders/items on Reports mount | `backend/controllers/reportController.js` `getOrdersWithItems` | Large payloads, slow query. |
| No database indexes on `reservations.store_id`, `date`, `status`, `time` | `006_qr_and_orders.sql` / `005_restaurant_ops.sql` | Full table scans likely. |
| Calendar view fetches only filtered date | `src/routes/_admin.reservations.tsx` | Cannot render arbitrary months efficiently. |
| Public storefront `FeaturedMenuSection` fetches all products | `src/components/shop/section-renderer.tsx` | Unbounded product lists. |
| Framer Motion on every dashboard element | Multiple dashboard components | Potential jank on low-end devices. |
| CMS editor refetches page + sections separately | `useCmsPage`, `useCmsPageSections` | Two round trips. |
| No query cancellation / debounce | Reservations, Search inputs | Stale results and extra requests. |

---

## 10. Security Risks

| Risk | Location | Severity |
|---|---|---|
| Hardcoded fallback cookie secret | `backend/server.js` line 14 | Medium (cookies unused for auth currently) |
| No global rate limiting | `backend/server.js` | Medium-High |
| No request logging / IDs | `backend/server.js` | Low-Medium |
| Theme toggle stored in localStorage only; no server preference | `src/components/theme-provider.tsx` | Low |
| `useMyStore` returns first store without role validation on frontend | `src/lib/use-my-store.ts` | Medium (backend enforces `requireStoreAccess`) |
| CMS section content is JSONB rendered directly; arbitrary HTML not sanitized in rich_text | `src/components/shop/section-renderer.tsx` | Medium |
| Public contact form has rate limit (5/hour/email) but no honeypot/CAPTCHA | `backend/models/CmsContactMessage.js` | Low-Medium |
| QR preview endpoint missing; users may rely on generated file only | `backend/routes/qr.js` | Low |

---

## 11. Recommended Migration Order

1. **Phase 0 (complete)** — Audit and document current state.
2. **Phase 1 — Theme isolation ✅** — Scoped dashboard theme provider and user preference API/table.
3. **Phase 2 — Dashboard data plumbing ✅** — `Orders`, `Guests`, `Reviews`, `Settings`, `Reports`, `Growth`, `AI Insights`, and `Hourly Heatmap` connected.
4. **Phase 3 — Menu Manager ✅** — Replaced `menu-db.ts` usage in menu route with backend CRUD; added category/product endpoints.
5. **Phase 4 — Operational pages ✅** — `CRM`, `Reservations`, and `Kitchen` connected to real data.
6. **Phase 5 — Reservations performance ✅** — Added indexes and date-range filtering.
7. **Phase 6 — Responsive layout ✅** — Refactored `_admin.tsx`, sidebar, bottom dock, mobile Sheet drawer.
8. **Phase 7 — Shared navigation registry ✅** — Unified sidebar + dock + More menu via `nav-config.ts`.
9. **Phase 8 — QR preview ✅** — Added `GET /api/qr/:storeId/:qrId` and frontend preview modal.
10. **Phase 9 — Reports analytics ✅** — Built real endpoints and charts; removed fixture data.
11. **Phase 10 — Growth + AI Insights pages ✅** — Created routes and connected existing growth/AI endpoints.
12. **Phase 11 — Notifications ✅** — Added table, endpoints, dropdown, badge.
13. **Phase 12-16 — CMS overview / pages / media / nav / SEO ✅** — Fixed overview quick links; built dedicated `/cms/media` (with file upload) and `/cms/announcements` routes; added CTA highlight toggle and SEO/slug preview in page editor.
14. **Phase 17-21 — Full-screen editor (partial)** — Editor now renders in a fixed full-screen overlay with an expanded toolbar, scroll-sync between section tree and preview, grouped section library with search, and an unsaved-changes browser guard.
15. **Phase 22-28 — CMS sections / contact / FAQ / events / themes (partial)** — Added structured content editors for FAQ, testimonials, opening hours, and social links; `featured_menu` now supports category filtering and limits.
16. **Phase 29-34 — Themes / AI builder / publishing safety ✅** — Ready-made themes, AI draft generation, version/rollback, unsaved guard, and contact-form analytics. See `docs/CMS_PROGRESS_REPORT.md`.
17. **Phase 35-37 — Backend polish, storefront rendering, tests, build** — Add missing indexes, endpoints, tests, responsive verification.

---

## 12. Quick Reference: Files to Modify First

- `src/components/theme-provider.tsx`
- `src/routes/_admin.tsx`
- `src/components/admin-sidebar.tsx`
- `src/components/bottom-dock.tsx`
- `src/lib/nav-config.ts`
- `src/lib/nav-layout-context.tsx`
- `src/routes/_admin.menu.tsx`
- `src/lib/menu-db.ts`
- `src/routes/_admin.reservations.tsx`
- `src/routes/_admin.reports.tsx` / `src/components/reports/reports-page.tsx`
- `src/routes/_admin.ai.tsx`
- `src/routes/_admin.kitchen.tsx`
- `src/components/cms/cms-page-editor.tsx`
- `src/components/shop/section-renderer.tsx`
- `backend/server.js`
- `backend/routes/qr.js`
- `backend/controllers/qrController.js`
- `backend/routes/reports.js`
- `backend/controllers/reportController.js`
- `backend/migrations/` (new migrations for user preferences, notifications, indexes, CMS theme tables)

---

## 13. Test & Build Baseline

- Current test scripts:
  - `backend/scripts/test_cms_full_suite_v2.js` — CMS V2 integration (40 passed).
  - `backend/scripts/test_cross_store_authorization.js` — multi-tenant auth (79/79 passed).
  - `backend/scripts/test_menu_manager.js` — menu CRUD, duplicate, bulk update, category reorder (all passed).
  - `backend/scripts/test_dashboard_stats.js`, `test_dashboard_hardening.js`.
  - `backend/scripts/test_growth_engine_phase*.js`.
- Frontend: `npm run build` succeeds; no unit tests exist.

---

*Next step: continue CMS V3 polish — section variants / real data sources (Phase 22-28), themes / AI builder / publishing safety (Phase 29-34), and final storefront/backend tests (Phase 35-37).*

