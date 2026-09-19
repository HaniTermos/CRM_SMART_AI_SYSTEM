# CMS V3 Issue Register

| ID | Area | Severity | Reproduction | Expected | Actual | Root Cause | Status |
|---|---|---|---|---|---|---|---|
| ISSUE-001 | Commerce / Cart | P3 | Inspect CartDrawerSection in editor mode | Shows production-ready system label | Showed "Shopify Cart Drawer Engine: Items in Mock Cart" | Hardcoded legacy draft string | **FIXED** (Updated to SmartStore Cart Drawer Engine with live cart state) |
| ISSUE-002 | Navigation Studio | P3 | Inspect navigation preview placeholder comment | Clear UI canvas description | Contained "Mock Page Content" comment | Legacy development comment | **FIXED** (Updated to Live Canvas Preview) |
| ISSUE-003 | Single-Store Migration Engine | P2 | Run migrate_cms_v3_store.js for non-sunrise stores | Cleanly parameterized store migration supporting all authorized tenant stores | Script had hardcoded store check restricting to sunrise-bakery | Early single-store restriction | **FIXED** (Fully parameterized CLI supporting authorized single-tenant migrations) |
| ISSUE-004 | Public Storefront Fallback | P1 | Query public V3 API when store flag is FALSE | Instant fallback to legacy CMS V2 without error | Handled correctly via publicController.js { v3Enabled: false, fallback: true } | Verified working as intended | **VERIFIED** |
| ISSUE-005 | Store Isolation Guard | P0 | Check if store A can read or write store B's V3 data | Strict store_id scoping across all endpoints and DB queries | Verified 100% store_id parameterized queries across controllers | Verified working as intended | **VERIFIED** |
