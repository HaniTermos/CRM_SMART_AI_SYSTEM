# CMS V3 SEO & Launch Checklist

## URL Structure & Continuity
- [x] Slugs maintain 1:1 parity with legacy store URLs (`/shop/:slug`, `/shop/:slug/about`, `/shop/:slug/contact`)
- [x] Legacy custom pages automatically routed through public resolver fallback when unmigrated
- [x] Clean 404 handling on non-existent routes without server crashes or sensitive stack trace exposure

## Meta Tags & OpenGraph
- [x] Dynamic `<title>` generated per page from `seo_metadata.title` (fallback to page title + store name)
- [x] Meta description rendered from `seo_metadata.description`
- [x] OpenGraph meta tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) supported
- [x] Canonical link tags `<link rel="canonical" href="..." />` injected on all public pages

## Structured Data (JSON-LD)
- [x] Storefront schema (`schema.org/Store` or `schema.org/Restaurant`) rendered with name, address, telephone, and opening hours
- [x] Product schema (`schema.org/Product`) rendered on product spotlight and menu sections with price, availability, and currency
- [x] Breadcrumb list schema rendered for hierarchical navigation

## Performance & Accessibility
- [x] Responsive `<img />` tags with `alt` text attribute mapping from media library metadata
- [x] Lazy loading (`loading="lazy"`) enabled on below-the-fold imagery
- [x] Semantic HTML5 elements (`<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`) used across all AST component definitions
