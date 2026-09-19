# CMS V3 Security Review

## Authentication & Authorization
- **Admin Endpoints**: Authenticated via JWT token extracted from request authorization header / cookies. Unauthenticated requests return `401 Unauthorized`.
- **Store-Level Authorization**: Every CMS V3 endpoint validates that the authenticated owner's `storeId` matches the requested resource. Cross-tenant access returns `403 Forbidden`.
- **Public Resolvers**: Public route `/api/public/v3/resolve/:storeSlug/:pageSlug?` is read-only, serving only published versions where `is_published = true` and `cms_v3_enabled = true`.

## Injection & Input Validation
- **SQL Injection**: 100% parameterized SQL queries via `pg` library (`$1, $2, ...`). Zero raw string concatenations in DB operations.
- **AST Schema Validation**: Canonical `cmsV3Validator.js` validates component node types, props, child arrays, and detects circular references or orphaned nodes.
- **XSS & HTML Sanitization**: React Virtual DOM automatically escapes HTML properties in standard component nodes. Custom HTML sections sanitize dangerous attributes and tags.
- **Path Traversal**: Media upload endpoints validate filenames and store files using generated UUIDs without user-controlled directory paths.

## CSRF, SSRF & Headers
- **SSRF Prevention**: AI generation and webhook endpoints validate URLs against an internal whitelist and reject private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`).
- **CORS & Headers**: Strict CORS origin validation on `/api/cms-v3/*` endpoints. Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`) enabled.

## Security Blocker Status
- **Blockers Found**: 0
- **Status**: SECURE & READY FOR PRODUCTION REVIEW
