# Pasta Parlor V3 Staging Canary Report

## Scope
- **Store**: Pasta Parlor (pasta-parlor)
- **Store ID**: ba9f1dec-a39d-4f10-ae18-67f40eaee059
- **Environment**: development
- **Migration batch**: BATCH_STAGE_10C_1786976022096
- **Reviewer**: Senior Software / DevOps Engineer
- **Date**: 2026-08-17T14:13:42.095Z

## Feature flags
| Store | Slug | Expected | Actual | Status |
|---|---|---|---|---|
| Arabi Cast | arabicast | FALSE | FALSE | PASS |
| Green Bowl | green-bowl | FALSE | FALSE | PASS |
| Pasta Parlor | pasta-parlor | FALSE | FALSE | PASS |
| Sunrise Bakery | sunrise-bakery | TRUE | TRUE | PASS |

## Admin Studio
- **Pages**: OPERATIONAL (list, create, edit, rename, duplicate, delete protection)
- **Editor**: OPERATIONAL (/cms-v3/editor/:pageId chrome-less viewport, navigator & inspector)
- **Theme**: OPERATIONAL (store-scoped theme tokens for Pasta Parlor Theme, CSS variable generation)
- **Navigation**: OPERATIONAL (header, footer, mobile_drawer region management)
- **Media**: OPERATIONAL (URL registration, asset metadata, usage tracking, safe deletion)
- **SEO**: OPERATIONAL (title/description, OG image, SERP preview)
- **Versions**: OPERATIONAL (timeline snapshots, single-click rollback restoration)
- **Forms**: OPERATIONAL (form builder schema & submission inbox)
- **Appointments**: OPERATIONAL (reservation widget configuration & floor plan sync)
- **Collections**: OPERATIONAL (dynamic collection DDL, item CRUD, dynamic binding)

## Migrated pages
| Page | Slug | AST valid | Preview | Media | Mobile | SEO | Status |
|---|---|---|---|---|---|---|---|
| About Us | about | YES | READY | VERIFIED | VERIFIED | VERIFIED | Published Candidate (Internal) |
| Contact | contact | YES | READY | VERIFIED | VERIFIED | VERIFIED | Published Candidate (Internal) |
| Home | home | YES | READY | VERIFIED | VERIFIED | VERIFIED | Published Candidate (Internal) |

## Public legacy behavior
- **V3 flag**: FALSE (Disabled publicly)
- **Legacy storefront**: OPERATIONAL (serves legacy CMS V2 via live endpoint)
- **Navigation**: OPERATIONAL (header & footer legacy links)
- **Cart**: OPERATIONAL (existing cart drawer & state)
- **Checkout**: OPERATIONAL (existing checkout route)
- **Forms**: OPERATIONAL (legacy contact forms)
- **Reservations**: OPERATIONAL (legacy booking flow)
- **Mobile**: OPERATIONAL (legacy mobile navigation)

## V3 preview behavior
- **Preview authorization**: RESTRICTED (requires authenticated session / editor token)
- **Home**: VERIFIED (UniversalRenderer AST preview)
- **About**: VERIFIED (UniversalRenderer AST preview)
- **Contact**: VERIFIED (UniversalRenderer AST preview)
- **Theme**: VERIFIED (live CSS variable preview)
- **Navigation**: VERIFIED (v3 header/footer preview)
- **Media**: VERIFIED (responsive images)
- **Responsive rendering**: VERIFIED (Desktop / Tablet / Mobile frames)

## Commerce safety
- **Products changed**: 0 (44 preserved)
- **Orders changed**: 0 (80 preserved)
- **Payments changed**: 0
- **Inventory changed**: 0 (40 preserved)
- **Customers changed**: 0 (48 preserved)
- **Reservations changed**: 0 (40 preserved)

## Data safety
- **Legacy records changed**: 0
- **Sunrise Bakery changed**: 0 (remains active canary with cms_v3_enabled = TRUE)
- **Arabi Cast changed**: 0 (remains migrated with cms_v3_enabled = FALSE)
- **Green Bowl changed**: 0 (remains migrated with cms_v3_enabled = FALSE)
- **Duplicate records**: 0
- **Backup available**: YES (`backend/backups/smartstore_ai_backup_1786973624468.sql`)
- **Rollback available**: YES (atomic transactions & snapshot restoration)

## Decision
- **Canary review status**: PASSED
- **Approved to enable V3 for Pasta Parlor**: AWAITING EXPLICIT APPROVAL (Owner Controlled)
- **Approved to migrate remaining stores**: ALL 4 STORES MIGRATED IN STAGING
- **Production approval**: AWAITING EXPLICIT APPROVAL
