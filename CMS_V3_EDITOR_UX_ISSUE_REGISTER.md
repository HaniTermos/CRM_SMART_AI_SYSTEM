# SmartStore AI CMS V3 — Visual Editor Issue Register

| Issue ID | Category | Severity | Description | Root Cause | Status | Verification Target |
|---|---|---|---|---|---|---|
| **ISSUE-01** | Template Mutation | High | Adding text/component to templated section fails | Monolithic section components did not render AST child slots | In Progress | Canvas drag & drop into sections |
| **ISSUE-02** | Persistence | Critical | Section property modifications not saved | Top-level section props mutated instead of granular node AST | In Progress | Full reload draft rehydration test |
| **ISSUE-03** | Concurrency | High | Draft autosave missing or unreliable race conditions | Async save calls lacked monotonic version fencing | In Progress | Rapid typing autosave test |
| **ISSUE-04** | Interaction | Medium | Hovering a component lacks functional CRUD toolbar | Canvas wrapper only rendered basic selection | In Progress | Move up/down, duplicate, delete, wrap actions |
| **ISSUE-05** | UI Architecture | High | Two competing sidebars creating split workspace | Left navigator and right inspector rendered concurrently | In Progress | Single unified master sidebar studio |
| **ISSUE-06** | Navigation | Low | Structure panel was not optional/collapsible | Hardcoded left drawer without unified panel switcher | In Progress | Collapsible Structure tab in unified sidebar |
| **ISSUE-07** | Inspector | Medium | Containers lacked comprehensive Layout/Style/Advanced tabs | Basic styling inputs missing responsive/box-model controls | In Progress | Flexbox, Grid, 2D Box Model, Spacing tabs |
| **ISSUE-08** | Component Editing | Medium | Text/Buttons lacked dedicated rich content/style controls | Inspectors lacked typography font family, text stroke, states | In Progress | Button & Text dedicated content/style tabs |
| **ISSUE-09** | Usability | Medium | Overwhelming controls for normal business owners | Lack of progressive disclosure (Simple vs Expert mode) | In Progress | Mode toggle with plain-language presets |
| **ISSUE-10** | Theme Tokens | Medium | Brand palettes did not inject dynamic CSS variables live | Hardcoded hex colors without live variable cascade | In Progress | 1-Click palette switcher in Globals tab |
