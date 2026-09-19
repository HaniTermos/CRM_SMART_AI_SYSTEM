# Sunrise Bakery V3 Staging Canary Report

## Scope
- **Store**: Sunrise Bakery (sunrise-bakery)
- **Store ID**: 97900e09-1cbc-4da5-b5b7-8c695d7dd2f9
- **Environment**: development
- **Migration batch**: BATCH_STAGE_8CB_1786969864073
- **Reviewer**: Senior Software / DevOps Engineer
- **Date**: 2026-08-17T13:03:04.827Z

## Admin Studio
- **Pages**: OPERATIONAL (list, create, edit, rename, duplicate, delete protection)
- **Editor**: OPERATIONAL (/cms-v3/editor/:pageId chrome-less viewport, navigator & inspector)
- **Theme**: OPERATIONAL (store-scoped theme tokens, CSS variable generation)
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
| Home | home | YES | READY | VERIFIED | VERIFIED | DEFAULT | Published Candidate (Internal) |

## Public legacy behavior
- **V3 flag**: FALSE (Disabled)
- **Legacy storefront**: OPERATIONAL (serves legacy CMS V2)
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
- **Products changed**: 0
- **Orders changed**: 0
- **Payments changed**: 0
- **Inventory changed**: 0
- **Customers changed**: 0
- **Reservations changed**: 0

## Data safety
- **Legacy records changed**: 0
- **Other stores changed**: 0
- **Duplicate records**: 0
- **Backup available**: YES (`backend/backups/smartstore_ai_backup_1786969698333.sql`)
- **Rollback available**: YES (atomic transactions & snapshot restoration)

## Decision
- **Canary status**: PASSED
- **Approved to enable V3 for Sunrise Bakery**: AWAITING EXPLICIT APPROVAL
- **Approved to migrate other stores**: AWAITING EXPLICIT APPROVAL
- **Production approval**: AWAITING EXPLICIT APPROVAL
