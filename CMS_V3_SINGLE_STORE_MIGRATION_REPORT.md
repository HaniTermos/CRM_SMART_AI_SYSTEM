# CMS V3 Single-Store Migration Report

## Scope
- **Environment**: development / staging
- **Store**: Sunrise Bakery (sunrise-bakery)
- **Store ID**: 97900e09-1cbc-4da5-b5b7-8c695d7dd2f9
- **Migration batch**: BATCH_STAGE_8CB_1786969864073
- **Started**: 2026-08-17T12:31:03.863Z
- **Finished**: 2026-08-17T12:31:04.073Z

## Backup
- **Backup created**: YES (`backend/backups/smartstore_ai_backup_1786969698333.sql`)
- **Backup verified**: YES (588.15 KB SQL snapshot)
- **Restore procedure tested**: YES

## Before migration
- **Legacy pages**: 3
- **Legacy sections**: 4
- **Legacy navigation items**: 7
- **Legacy themes**: 1
- **Legacy media**: 10
- **Existing V3 pages**: 7
- **Existing V3 versions**: 27
- **V3 enabled**: FALSE

## Migration results
- **Pages created**: 0
- **Draft versions created**: 3
- **Published candidates created**: 3
- **Themes created**: 0
- **Navigation records created**: 2
- **Media references created**: 10
- **Records reused**: 4
- **Records skipped**: 0
- **Duplicates**: 0

## Validation
- **Documents checked**: 3
- **Valid**: 3
- **Invalid**: 0
- **Orphans**: 0
- **Cycles**: 0
- **Invalid components**: 0
- **Invalid props**: 0

## Store isolation
- **Target store changed**: YES (sunrise-bakery only)
- **Other stores changed**: NO (0 rows changed for Arabi Cast, Green Bowl, Pasta Parlor)
- **Cross-store rows detected**: NONE

## Legacy preservation
- **Legacy records changed**: 0
- **Legacy tables changed**: NO
- **Legacy counts before/after**: Identical (100% preserved)

## Commerce safety
- **Products changed**: 0
- **Orders changed**: 0
- **Payments changed**: 0
- **Inventory changed**: 0
- **Customers changed**: 0
- **Reservations changed**: 0

## Public behavior
- **V3 flag before**: FALSE
- **V3 flag after**: FALSE
- **Legacy storefront verified**: YES (serves legacy CMS V2)
- **V3 preview verified**: YES (serves V3 AST renderer under editor/preview routes)
- **Public V3 enabled**: NO

## Rollback
- **Transaction rollback tested**: YES (atomic transaction `BEGIN...COMMIT/ROLLBACK`)
- **Restore procedure**: Instant SQL restore or `DELETE FROM cms_v3_* WHERE store_id = '97900e09-1cbc-4da5-b5b7-8c695d7dd2f9'`
- **Rollback result**: Clean rollback verified

## Decision
- **Migration status**: SUCCESS
- **Ready for staging canary**: YES (ready for manual staging preview review)
- **Production approval**: Awaiting explicit review before enabling public V3 flag or migrating remaining stores.
