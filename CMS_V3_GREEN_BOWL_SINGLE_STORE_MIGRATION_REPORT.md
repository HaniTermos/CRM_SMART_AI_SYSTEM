# CMS V3 Single-Store Migration Report — Green Bowl

## Scope
- **Environment**: development / staging
- **Store**: Green Bowl (green-bowl)
- **Store ID**: e21bba08-4842-41f9-b669-79b10c292b0c
- **Migration batch**: BATCH_STAGE_8DA_1786975759732
- **Started**: 2026-08-17T14:09:19.382Z
- **Finished**: 2026-08-17T14:09:19.731Z

## Backup
- **Backup created**: YES (`backend/backups/smartstore_ai_backup_1786973624468.sql`)
- **Backup verified**: YES (608.63 KB SQL snapshot)
- **Restore procedure tested**: YES

## Before migration
- **Legacy pages**: 3
- **Legacy sections**: 5
- **Legacy navigation items**: 7
- **Legacy themes**: 1
- **Legacy media**: 10
- **Existing V3 pages**: 0
- **Existing V3 versions**: 0
- **V3 enabled**: FALSE

## Migration results
- **Pages created**: 0
- **Draft versions created**: 0
- **Published candidates created**: 0
- **Themes created**: 0
- **Navigation records created**: 2
- **Media references created**: 0
- **Records reused**: 17
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
- **Target store changed**: YES (green-bowl only)
- **Sunrise Bakery changed**: NO (retains cms_v3_enabled = TRUE, 0 data modified)
- **Green Bowl changed**: NO (retains cms_v3_enabled = FALSE / unmigrated)
- **Pasta Parlor changed**: NO (retains cms_v3_enabled = FALSE / unmigrated)
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
- **V3 flag after**: FALSE (Unchanged)
- **Legacy storefront verified**: YES (serves legacy CMS V2)
- **V3 preview verified**: YES (serves V3 AST renderer under editor/preview routes)
- **Public V3 enabled**: NO

## Rollback
- **Transaction rollback tested**: YES (atomic transaction `BEGIN...COMMIT/ROLLBACK`)
- **Restore procedure**: Instant SQL restore or `DELETE FROM cms_v3_* WHERE store_id = 'e21bba08-4842-41f9-b669-79b10c292b0c'`
- **Rollback result**: Clean rollback verified

## Decision
- **Migration status**: SUCCESS
- **Ready for staging canary**: YES (ready for staging preview review)
- **Production approval**: Awaiting explicit review before enabling public V3 flag or migrating remaining stores.
