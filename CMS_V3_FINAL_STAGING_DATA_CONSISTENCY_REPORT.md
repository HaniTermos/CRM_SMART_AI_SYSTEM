# CMS V3 Final Staging Data Consistency Report

## 1. Audit Scope & Methodology
- **Audit Date**: 2026-08-17T14:29:58Z
- **Execution Mode**: READ-ONLY (Zero writes, zero flag mutations, zero schema changes)
- **Database Scope**: All 4 tenant stores across `stores`, `cms_v3_sites`, `cms_v3_pages`, `cms_v3_page_versions`, `cms_v3_themes`, `cms_v3_navigation`, `cms_v3_media_usage`, legacy tables, and commerce tables.

---

## 2. Clarification of Migration Report Metrics

### Why Green Bowl & Pasta Parlor Reports Showed "Pages Created = 0"
During the Stage 10 rollout workflow:
1. **Pass 1 (Initial Migration)**: The migration script ran transactionally and created 3 V3 pages, 3 version snapshots, 1 theme, 2 navigation records, and registered media references.
2. **Pass 2 (Mandatory Idempotency Drill)**: The migration script was immediately re-executed against the same store to verify zero duplicates.
3. Because the migration script is designed to be completely idempotent, Pass 2 detected all existing records, logged `Reused existing V3 page ...`, created **0 duplicate rows**, and wrote the report reflecting the second pass audit counters (`recordsReused: 17, pagesCreated: 0, duplicates: 0`).
4. **Current Database State**: Verified. All three pages (`home`, `about`, `contact`) and their published version AST documents exist, are fully populated, and are 100% operational in the database.

---

## 3. Database Entity Verification Across All 4 Stores

| Store Name | Slug | Store ID | V3 Flag | V3 Pages | Total Versions | Published Versions | Themes | Nav Regions | Media Usage Refs | Valid AST Documents |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Arabi Cast** | `arabicast` | `2d9b6e0f-c256-426b-ba8c-e3976d1ee109` | `FALSE` | 3 | 3 | 3 | 1 | 2 (`header`, `footer`) | 10 | 3 / 3 (100%) |
| **Green Bowl** | `green-bowl` | `e21bba08-4842-41f9-b669-79b10c292b0c` | `FALSE` | 3 | 3 | 3 | 1 | 2 (`header`, `footer`) | 10 | 3 / 3 (100%) |
| **Pasta Parlor** | `pasta-parlor` | `ba9f1dec-a39d-4f10-ae18-67f40eaee059` | `FALSE` | 3 | 3 | 3 | 1 | 2 (`header`, `footer`) | 10 | 3 / 3 (100%) |
| **Sunrise Bakery** | `sunrise-bakery` | `97900e09-1cbc-4da5-b5b7-8c695d7dd2f9` | `TRUE` | 9 | 33 | 3 (core) | 1 | 3 (`header`, `footer`, `mobile`) | 20 | All Valid |

---

## 4. Multi-Tenant Cross-Store Isolation Audit

- **Page-to-Version `store_id` Mismatch**: `0` (Zero cross-tenant version links).
- **Site-to-Theme `store_id` Mismatch**: `0` (Zero cross-tenant active theme pointers).
- **Unauthenticated / Fallback Serving**: Verified over HTTP. All 3 non-canary stores (`arabicast`, `green-bowl`, `pasta-parlor`) return `{ v3Enabled: false, fallback: true }` and serve legacy CMS V2.

---

## 5. Page-Level AST Integrity & Source Traceability

### Arabi Cast (`arabicast`)
- `home` (Home): AST VALID | Published Version Active | Traceability: `Migrated from legacy page 18a8b1cb-a035-4309-8422-42171ca533eb`
- `about` (About Us): AST VALID | Published Version Active | Traceability: `Migrated from legacy page e1b56ce8-3f5f-46e3-85f2-2b62d37c897f`
- `contact` (Contact): AST VALID | Published Version Active | Traceability: `Migrated from legacy page fc02ae2b-2401-4475-ae90-c20e2efc188b`

### Green Bowl (`green-bowl`)
- `home` (Home): AST VALID | Published Version Active | Traceability: `Migrated from legacy page 5efae674-6ab0-4961-8255-a0a1098679f2`
- `about` (About Us): AST VALID | Published Version Active | Traceability: `Migrated from legacy page aa17eb2c-f6ef-46c5-af47-b5bf17b85848`
- `contact` (Contact): AST VALID | Published Version Active | Traceability: `Migrated from legacy page 55efc2cb-4fa1-4a47-a7eb-2e861d8df5f6`

### Pasta Parlor (`pasta-parlor`)
- `home` (Home): AST VALID | Published Version Active | Traceability: `Migrated from legacy page 956aedd3-58e1-4a29-8375-b4c1d19ef858`
- `about` (About Us): AST VALID | Published Version Active | Traceability: `Migrated from legacy page 040da3eb-1c70-42a6-af04-621b610295f0`
- `contact` (Contact): AST VALID | Published Version Active | Traceability: `Migrated from legacy page dfd6d653-d0b3-43c8-8508-50dffd55ef78`

---

## 6. Commerce & Legacy Table Fingerprints (100% Preserved)

| Domain | Table Name | Total Row Count | Status |
|---|---|:---:|:---:|
| **Commerce** | `products` | 44 | Unmodified |
| **Commerce** | `orders` | 80 | Unmodified |
| **Commerce** | `order_items` | 187 | Unmodified |
| **Commerce** | `customers` | 48 | Unmodified |
| **Commerce** | `reservations` | 40 | Unmodified |
| **Commerce** | `inventory_adjustments` | 40 | Unmodified |
| **Legacy CMS** | `cms_pages` | 12 | Unmodified |
| **Legacy CMS** | `cms_page_sections` | 17 | Unmodified |
| **Legacy CMS** | `cms_settings` | 4 | Unmodified |
| **Legacy CMS** | `cms_navigation_items` | 28 | Unmodified |
| **Legacy CMS** | `cms_media` | 40 | Unmodified |
| **Legacy CMS** | `cms_themes` | 29 | Unmodified |

---

## 7. Consistency Conclusion
The data across all four stores is **100% consistent, isolated, and valid**. Staging holds 4 fully migrated stores with 0 data contamination and 0 commerce regressions.
