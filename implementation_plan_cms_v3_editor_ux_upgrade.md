# SmartStore AI CMS V3 — Visual Editor UX & Architectural Upgrade Plan

## Executive Summary
This document defines the production engineering roadmap to upgrade SmartStore AI CMS V3 from a fragmented visual editor into a unified, high-performance visual website studio combining the best paradigms of **Elementor Pro**, **Shopify Section Architecture**, **Webflow Style System**, **Wix Studio**, and **Framer**.

---

## 1. Problem Statements & Root Cause Analysis

### Problem 1: Adding Components to Templated Sections Failed
- **Root Cause**: Templated sections were treated as monolithic JSX components with hardcoded children instead of polymorphic container nodes that accept child AST nodes (`childrenNodes`).
- **Solution**: Upgrade section renderers (`HeroSection`, `StoryAboutSection`, `ContentSections`, etc.) to render dynamic child slot containers and update template generators to create full AST trees with composable child primitives (`TextAtom`, `ButtonAtom`, `ImageAtom`, `FlexContainer`).

### Problem 2: Changes Inside Sections Were Not Persisted
- **Root Cause**: Component property updates inside monolithic sections updated top-level section props instead of granular child AST nodes.
- **Solution**: Strict `PageDocument` AST normalization where all sub-elements have unique UUIDs and updates route through the atomic `updateNodeProps` / `updateNodeStyles` commands.

### Problem 3: Autosave Reliability & Race Hazards
- **Root Cause**: Rapid typing or property adjustments lacked monotonic version fencing, causing asynchronous save race conditions where older in-flight requests could overwrite newer client states.
- **Solution**: Implement monotonic `saveVersionRef` + debounced persistence + optimistic revision tracking against PostgreSQL draft versions.

### Problem 4: Duplicate Sidebar Chrome
- **Root Cause**: Separate navigation sidebar and right inspector sidebar created competing mental models and squeezed canvas width.
- **Solution**: Merge into **One Unified Master Sidebar** with 5 primary modes:
  1. **Structure** (Layer tree, page hierarchy, breadcrumbs)
  2. **Widgets** (Business-oriented high-level sections: Hero, Menu, Reservation, Contact, Testimonials)
  3. **Components** (Low-level building blocks: Text, Heading, Button, Image, Container, Grid, Spacer)
  4. **Globals** (Brand Center, Theme Tokens, Color Palettes, Typography, Reusable Symbols)
  5. **Page** (SEO, OpenGraph, slug, page background, custom scripts)
  *Contextual Inspector*: When an element is selected on canvas, the sidebar seamlessly switches into the **Inspector Mode** with **Layout**, **Style**, and **Advanced** tabs.

### Problem 5: Missing Progressive Disclosure
- **Root Cause**: Advanced Flexbox/CSS properties overwhelmed non-technical store owners, while advanced designers lacked fine-grained control.
- **Solution**: Implement a top-level **"Simple" vs "Expert"** toggle. Simple mode presents plain-language controls and presets; Expert mode unlocks raw CSS variables, transforms, custom CSS, and responsive breakpoints.

---

## 2. Technical Architecture & Data Flow

```
User Action (Canvas click / drag / input)
  ↓
Command Reducer (`useEditorEngine`)
  ↓
Immutable PageDocument Clone & AST Validation
  ↓
Real-Time React Canvas Re-render (UniversalRenderer)
  ↓
Debounced Autosave Worker (800ms)
  ↓
POST /api/cms-v3/me/pages/:pageId/save-draft (Store-Scoped Auth)
  ↓
PostgreSQL `cms_v3_page_versions` (Draft Version Record)
  ↓
Client Revision Confirmed (Save status: Saved)
```

---

## 3. Implementation Breakdown by Phase

1. **AST & Mutation Engine**: Command reducer, template AST expansion, immutable node updates.
2. **Unified Sidebar Studio Architecture**: Single sidebar with Structure, Widgets, Components, Globals, Page, and Contextual Inspector.
3. **Progressive Disclosure (Simple vs Expert Mode)**: Easy presets for merchants, granular controls for power users.
4. **Enhanced Hover & Contextual Canvas CRUD**: Floating toolbar with Parent, Move, Duplicate, Delete, Add Before/After, Wrap, and Ask AI.
5. **Section Slot Rendering**: Section containers allowing arbitrary nested child dropping and rendering.
6. **Live Brand Theme Engine**: Instant CSS variable propagation across all canvas elements.
7. **Regression Testing & Verification**: Complete execution of all test suites.
