# Sunrise Bakery CMS V3 Canary Monitoring Report

## Scope
- **Store**: Sunrise Bakery (sunrise-bakery)
- **Store ID**: 97900e09-1cbc-4da5-b5b7-8c695d7dd2f9
- **Environment**: development
- **Monitoring batch**: BATCH_STAGE_8CD_1786975483943
- **Start**: 2026-08-17T14:04:43.511Z
- **End**: 2026-08-17T14:04:43.942Z

## Feature flags
| Store | Slug | Expected | Actual | Status |
|---|---|---|---|---|
| Arabi Cast | arabicast | FALSE | FALSE | PASS |
| Green Bowl | green-bowl | FALSE | FALSE | PASS |
| Pasta Parlor | pasta-parlor | FALSE | FALSE | PASS |
| Sunrise Bakery | sunrise-bakery | TRUE | TRUE | PASS |

## Public routes (live HTTP verification)
| Route | HTTP | V3 Rendered | Document | Page | Status |
|---|---:|---|---|---|---|
| http://localhost:5002/api/public/v3/resolve/sunrise-bakery | 200 | YES | VALID | home | PASS |
| http://localhost:5002/api/public/v3/resolve/sunrise-bakery/about | 200 | YES | VALID | about | PASS |
| http://localhost:5002/api/public/v3/resolve/sunrise-bakery/contact | 200 | YES | VALID | contact | PASS |

## Store isolation (live HTTP verification)
| Store | v3Enabled | fallback | Status |
|---|---|---|---|
| arabicast | false | true | ISOLATED |
| green-bowl | false | true | ISOLATED |
| pasta-parlor | false | true | ISOLATED |

## Database fingerprint comparison
| Table | Before | After | Delta |
|---|---:|---:|---:|
| products | 44 | 44 | 0 |
| orders | 80 | 80 | 0 |
| order_items | 187 | 187 | 0 |
| customers | 48 | 48 | 0 |
| reservations | 40 | 40 | 0 |
| inventory_adjustments | 40 | 40 | 0 |
| cms_pages | 12 | 12 | 0 |
| cms_page_sections | 17 | 17 | 0 |
| cms_settings | 4 | 4 | 0 |
| cms_navigation_items | 28 | 28 | 0 |
| cms_media | 40 | 40 | 0 |
| cms_themes | 29 | 29 | 0 |
| cms_v3_pages | 12 | 12 | 0 |
| cms_v3_page_versions | 36 | 36 | 0 |
| cms_v3_themes | 10 | 10 | 0 |
| cms_v3_navigation | 5 | 5 | 0 |
| cms_v3_media_usage | 30 | 30 | 0 |
| cms_v3_sites | 2 | 2 | 0 |

## Error checks
- **5xx**: 0
- **4xx**: 0
- **404**: 0
- **Renderer errors**: 0
- **Media errors**: 0
- **Form errors**: 0

## Warnings
- None

## Monitoring limitations
- This is a point-in-time local audit suite, not continuous production monitoring.
- Error checks are based on local API responses, not a centralized APM or error-tracking service.
- No real alerting pipeline (PagerDuty, Sentry, Datadog) is configured for this staging environment.

## Rollback drill
Rollback drill is executed as a separate tracked phase by the caller.
See the rollback drill section below (appended after drill execution).

## Assertions
- **Passed**: 24
- **Failed**: 0

## Decision
- **Canary status**: STABLE
- **Critical issues**: 0
- **Recommended next step**: Canary is stable. Ready for rollback drill and next-store dry-run preparation.
- **Approval required**: Explicit user approval required before migrating additional stores or enabling production V3.
