# CMS & Storefront Progress Report

**Date:** 2026-08-11  
**Scope:** Phases 29-34 — Themes, AI Builder, Publishing Safety, Form Analytics

## Summary

Completed a focused slice of the CMS & storefront roadmap that adds ready-made themes, AI-assisted page generation, safe publishing workflows, and contact-form analytics. All changes are live in the current development server.

---

## What Was Implemented

### 1. Theme System (Phase 29)

- **Database**
  - Migration `021_cms_themes.sql` adds `cms_themes` table and a `theme_id` foreign key on `cms_settings`.
  - Seeded 4 presets: **Classic**, **Warm**, **Minimal**, **Dark**.
  - Backfilled existing stores to the default theme.

- **Backend**
  - New model: `backend/models/CmsTheme.js`.
  - New endpoints:
    - `GET /api/stores/me/cms/themes`
    - `POST /api/stores/me/cms/themes/:themeId/apply`
  - Public storefront snapshot now returns `appearance.theme_id` and the active `theme` object.

- **Frontend**
  - New hooks: `useCmsThemes`, `useApplyCmsTheme`.
  - Theme preset selector added to **Brand & Appearance**.
  - Selecting a theme updates the draft colors, accent, font, and light/dark mode automatically.

### 2. AI Website Builder (Phase 30)

- **Backend**
  - Added CMS AI methods to `backend/services/AiService.js`:
    - `generateWebsitePlan(store, prompt)`
    - `editPagePlan(store, page, existingSections, prompt)`
    - `normalizeCMSPlan(data)` + fallback plan when no API key is configured.
  - New controller endpoints:
    - `POST /api/stores/me/cms/ai/generate-website`
    - `POST /api/stores/me/cms/ai/edit-page`
    - `POST /api/stores/me/cms/ai/apply-plan`
  - AI plans generate 4-7 storefront sections (hero, featured menu, about, gallery, testimonials, FAQ, contact form, CTA, etc.).

- **Frontend**
  - New hooks: `useGenerateWebsiteAI`, `useEditPageAI`, `useApplyAIPlan`.
  - AI builder card on the CMS Studio overview (generate homepage or preview ideas).
  - AI Edit button in the page editor toolbar.
  - Activity log labels updated for `ai_generate_website`, `ai_edit_page`, and `ai_apply_plan`.

### 3. Publishing Safety & Unsaved Guards (Phase 31)

- **Unsaved route guard**
  - Added `useBlocker` to the page editor.
  - Blocks in-app navigation when sections have unsaved changes.
  - Enables browser `beforeunload` warning for tab close/refresh.

- **Confirmation modals**
  - Reusable `ConfirmDialog` component (`src/components/cms/confirm-dialog.tsx`).
  - Page editor now shows confirmation dialogs for:
    - Publishing a page (with section count and unsaved-changes warning)
    - Restoring a previous version
    - Deleting a section
  - Brand & Appearance page now shows confirmation dialogs for:
    - Publishing brand settings
    - Rolling back to the previously published version

### 4. Contact Form Analytics (Phase 32)

- **Backend**
  - Added `CmsContactMessage.getAnalytics(storeId, days)` model method.
  - New endpoint: `GET /api/stores/me/cms/contact-messages/analytics?days=30`.
  - Returns total count, counts by status, daily submission counts, and top topics.

- **Frontend**
  - New hook: `useCmsContactMessageAnalytics`.
  - Stats cards added to the Contact Messages page (Total, Open, In Progress, Resolved).

---

## Files Changed

### Backend

- `backend/migrations/021_cms_themes.sql`
- `backend/models/CmsTheme.js` *(new)*
- `backend/models/CmsSettings.js`
- `backend/models/CmsPageSection.js`
- `backend/models/CmsContactMessage.js`
- `backend/controllers/cmsController.js`
- `backend/controllers/publicController.js`
- `backend/services/AiService.js`
- `backend/routes/cms.js`

### Frontend

- `src/lib/use-cms-v2.ts`
- `src/components/cms/cms-page.tsx`
- `src/components/cms/cms-page-editor.tsx`
- `src/components/cms/cms-overview-page.tsx`
- `src/components/cms/cms-contact-messages-page.tsx`
- `src/components/cms/confirm-dialog.tsx` *(new)*

---

## Verification

- Backend syntax checks passed for all modified files (`node -c`).
- TypeScript checks show no new errors in the CMS files we touched.
- Public storefront snapshot tested live and returns the active theme:

```json
{
  "theme_id": "6fe974f7-418d-41d5-bd14-e28885b74e89",
  "theme": {
    "name": "Classic",
    "slug": "classic",
    "colors": { "primary_color": "#190E85", "accent_color": "#00E0FF" }
  }
}
```

- Backend server restarted successfully on `http://localhost:5000`.

---

## Still Pending / Next Steps

The following items were intentionally left out of this slice and can be picked up next:

- **Section visibility scheduling** — show/hide sections based on date/time rules.
- **Advanced publish diffs** — side-by-side draft vs. published comparison before publishing.
- **Media upload via file picker** — currently media is added by URL only.
- **Form conversion tracking** — track views-to-submissions on contact forms.
- **Theme preview** — live preview before applying a theme.
