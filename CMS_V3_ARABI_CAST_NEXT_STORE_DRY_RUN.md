# Arabi Cast — CMS V3 Next-Store Dry-Run Report

## Scope
- **Store**: Arabi Cast (arabicast)
- **Store ID**: 2d9b6e0f-c256-426b-ba8c-e3976d1ee109
- **Environment**: development
- **Date**: 2026-08-17T13:22:46.374Z
- **Mode**: READ-ONLY (zero writes enforced via mutation trap)
- **Observed mutations**: 0

## Legacy inventory
- **Legacy pages**: 3
- **Legacy sections**: 5
- **Theme settings**: 1
- **Navigation items**: 7
- **Media assets**: 10

## Proposed V3 documents
| Page | Slug | Status | Legacy Sections | V3 Nodes | AST Valid |
|---|---|---|---:|---:|---|
| About Us | about | published | 0 | 0 | YES |
| Contact | contact | published | 0 | 0 | YES |
| Home | home | published | 5 | 5 | YES |

## Section mapping detail
### About Us (about)
- No sections found.



### Contact (contact)
- No sections found.



### Home (home)
- Legacy `hero` → V3 `hero` (source: 1a1d37f2-daae-4dd9-93b2-6fdfafcc43df)
- Legacy `featured_menu` → V3 `product-grid` (source: 9f9c1719-4a59-40ca-ba07-f3b0a9112069)
- Legacy `about` → V3 `story-about` (source: f2b52e77-25c4-4a99-a454-f9062ff77027)
- Legacy `contact_form` → V3 `contact-form` (source: 4cd521c1-1652-449d-b62a-3826f3738097)
- Legacy `about` → V3 `story-about` (source: 99a96998-7105-4dd2-8a0d-aca141afac0b)



## Warnings
- None

## Critical errors
- None

## Store readiness
- **Ready for migration**: YES
- **Database writes**: 0 (confirmed by mutation trap)
- **Feature flags changed**: 0
- **Legacy tables changed**: 0
- **Commerce tables changed**: 0
