# Green Bowl — CMS V3 Next-Store Dry-Run Report

## Scope
- **Store**: Green Bowl (green-bowl)
- **Store ID**: e21bba08-4842-41f9-b669-79b10c292b0c
- **Environment**: development
- **Date**: 2026-08-17T13:24:23.337Z
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
- Legacy `hero` → V3 `hero` (source: 3cea7155-b5cb-4f79-b4c3-212bd3d793ba)
- Legacy `featured_menu` → V3 `product-grid` (source: f51d8f0f-f15d-44cc-a94f-9ebbd22ff30f)
- Legacy `about` → V3 `story-about` (source: c070f38c-f818-4bcb-b7aa-0a7fae199d75)
- Legacy `contact_form` → V3 `contact-form` (source: 5761a757-3d95-4dda-aa17-c86b50ec5793)



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
