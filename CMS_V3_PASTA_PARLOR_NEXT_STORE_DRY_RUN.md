# Pasta Parlor — CMS V3 Next-Store Dry-Run Report

## Scope
- **Store**: Pasta Parlor (pasta-parlor)
- **Store ID**: ba9f1dec-a39d-4f10-ae18-67f40eaee059
- **Environment**: development
- **Date**: 2026-08-17T13:24:31.931Z
- **Mode**: READ-ONLY (zero writes enforced via mutation trap)
- **Observed mutations**: 0

## Legacy inventory
- **Legacy pages**: 3
- **Legacy sections**: 4
- **Theme settings**: 1
- **Navigation items**: 7
- **Media assets**: 10

## Proposed V3 documents
| Page | Slug | Status | Legacy Sections | V3 Nodes | AST Valid |
|---|---|---|---:|---:|---|
| About Us | about | published | 0 | 0 | YES |
| Contact | contact | published | 0 | 0 | YES |
| Home | home | published | 4 | 4 | YES |

## Section mapping detail
### About Us (about)
- No sections found.



### Contact (contact)
- No sections found.



### Home (home)
- Legacy `hero` → V3 `hero` (source: 956aedd3-58e1-4a29-8375-b4c1d19ef858)
- Legacy `featured_menu` → V3 `product-grid` (source: 4c9e5261-d2bd-45cc-9987-3e49a893f8ed)
- Legacy `about` → V3 `story-about` (source: 040da3eb-1c70-42a6-af04-621b610295f0)
- Legacy `contact_form` → V3 `contact-form` (source: dfd6d653-d0b3-43c8-8508-50dffd55ef78)



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
