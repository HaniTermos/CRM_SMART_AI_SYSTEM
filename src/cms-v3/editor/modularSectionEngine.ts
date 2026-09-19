/**
 * SmartStore Website Studio (CMS V3) — Modular Section AST Engine
 * Converts monolithic sections and templates into fully modular, granular AST component trees.
 * Every heading, eyebrow, subtitle, button, image, product card, review card, and form field
 * is an independent, drag-and-drop editable, movable, styleable, and deletable node.
 */

import { PageDocument, PageNode } from "../types/cms-v3";

export interface ModularSectionResult {
  rootSectionId: string;
  primarySelectId: string;
  nodes: Record<string, PageNode>;
}

/**
 * Generate a unique ID with prefix, timestamp, and random suffix
 */
function uid(prefix: string): string {
  const ts = Date.now().toString().slice(-4);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${ts}-${rand}`;
}

/**
 * Decomposes or generates a fully modular section AST for any component type
 */
export function generateModularSection(
  componentKey: string,
  initialProps: Record<string, unknown> = {},
  initialStyles: Record<string, unknown> = {},
  customIdPrefix?: string
): ModularSectionResult {
  const p = initialProps || {};
  const s = initialStyles || {};

  // 1. HERO SECTION
  if (componentKey === "hero") {
    const secId = customIdPrefix || uid("sec-hero");
    const rowId = uid("row-hero");
    const colContentId = uid("col-hero-content");
    const eyebrowId = uid("text-eyebrow");
    const titleId = uid("text-title");
    const subtitleId = uid("text-sub");
    const btnRowId = uid("row-btns");
    const btnPrimaryId = uid("btn-primary");
    const btnSecondaryId = uid("btn-secondary");
    const colMediaId = uid("col-hero-media");
    const imageId = uid("img-hero");

    const eyebrowText = (p.eyebrow as string) || "✨ Artisan Craftsmanship";
    const titleText = (p.title as string) || "Handcrafted Daily with Heritage Grains";
    const subtitleText =
      (p.subtitle as string) ||
      (p.description as string) ||
      "Slow wild fermentation delivering unmatched aroma, crisp golden crust, and wholesome flavor in every bite.";
    const primaryLabel = (p.primaryCtaText as string) || "Order Online";
    const primaryUrl = (p.primaryCtaLink as string) || "/menu";
    const secondaryLabel = (p.secondaryCtaText as string) || "Reserve Table";
    const secondaryUrl = (p.secondaryCtaLink as string) || "/reservations";
    const imgUrl =
      (p.imageUrl as string) ||
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80";

    const nodes: Record<string, PageNode> = {
      [secId]: {
        id: secId,
        kind: "section",
        component: "section",
        children: [rowId],
        props: { title: "Hero Banner Section" },
        styles: {
          base: {
            paddingY: (s.paddingY as string) || (s.padding as string) || "4rem",
            width: "100%",
            backgroundColor: (s.backgroundColor as string) || "var(--color-background)",
          },
        },
      },
      [rowId]: {
        id: rowId,
        kind: "container",
        component: "flex-container",
        children: [colContentId, colMediaId],
        props: { title: "Hero Split Row" },
        styles: {
          base: {
            flexDirection: "row",
            gap: "2.5rem",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            width: "100%",
            padding: "0",
          },
        },
      },
      [colContentId]: {
        id: colContentId,
        kind: "container",
        component: "flex-container",
        children: [eyebrowId, titleId, subtitleId, btnRowId],
        props: { title: "Hero Content Column" },
        styles: {
          base: {
            flexDirection: "column",
            gap: "1rem",
            alignItems: "flex-start",
            flex: "1 1 320px",
            padding: "0",
          },
        },
      },
      [eyebrowId]: {
        id: eyebrowId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: eyebrowText, tag: "span", title: "Eyebrow Badge" },
        styles: {
          base: {
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-primary)",
            backgroundColor: "var(--color-surface-muted)",
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
          },
        },
      },
      [titleId]: {
        id: titleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: titleText, tag: "h1", title: "Hero Heading (H1)" },
        styles: {
          base: {
            fontSize: "2.5rem",
            fontWeight: 800,
            lineHeight: 1.2,
            color: "var(--color-text)",
          },
        },
      },
      [subtitleId]: {
        id: subtitleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: subtitleText, tag: "p", title: "Hero Subtitle" },
        styles: {
          base: {
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
          },
        },
      },
      [btnRowId]: {
        id: btnRowId,
        kind: "container",
        component: "flex-container",
        children: [btnPrimaryId, btnSecondaryId],
        props: { title: "Hero Buttons Row" },
        styles: {
          base: {
            flexDirection: "row",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap",
            padding: "0.5rem 0 0 0",
          },
        },
      },
      [btnPrimaryId]: {
        id: btnPrimaryId,
        kind: "element",
        component: "button",
        children: [],
        props: { label: primaryLabel, url: primaryUrl, title: "Primary CTA Button" },
        styles: {
          base: {
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-contrast)",
            borderRadius: "var(--shape-button-radius)",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 700,
          },
        },
      },
      [btnSecondaryId]: {
        id: btnSecondaryId,
        kind: "element",
        component: "button",
        children: [],
        props: { label: secondaryLabel, url: secondaryUrl, title: "Secondary CTA Button" },
        styles: {
          base: {
            backgroundColor: "transparent",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--shape-button-radius)",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          },
        },
      },
      [colMediaId]: {
        id: colMediaId,
        kind: "container",
        component: "flex-container",
        children: [imageId],
        props: { title: "Hero Media Column" },
        styles: {
          base: {
            flex: "1 1 320px",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
          },
        },
      },
      [imageId]: {
        id: imageId,
        kind: "element",
        component: "image",
        children: [],
        props: { url: imgUrl, alt: titleText, title: "Hero Image Asset" },
        styles: {
          base: {
            aspectRatio: "4/3",
            borderRadius: "var(--shape-card-radius)",
            width: "100%",
            objectFit: "cover",
          },
        },
      },
    };

    return { rootSectionId: secId, primarySelectId: titleId, nodes };
  }

  // 2. STORY / ABOUT SECTION
  if (componentKey === "story-about") {
    const secId = customIdPrefix || uid("sec-story");
    const rowId = uid("row-story");
    const colContentId = uid("col-story-content");
    const eyebrowId = uid("text-story-eyebrow");
    const titleId = uid("text-story-title");
    const storyId = uid("text-story-p");
    const colMediaId = uid("col-story-media");
    const imageId = uid("img-story");

    const eyebrowText = (p.eyebrow as string) || "Our Heritage";
    const titleText = (p.title as string) || "Slow Fermentation & Honest Ingredients";
    const storyText =
      (p.story as string) ||
      (p.subtitle as string) ||
      (p.description as string) ||
      "Founded in 2018, our kitchen honors classic baking methods. Every loaf is shaped by hand and baked in our stone-hearth oven at dawn.";
    const imgUrl =
      (p.imageUrl as string) ||
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80";

    const nodes: Record<string, PageNode> = {
      [secId]: {
        id: secId,
        kind: "section",
        component: "section",
        children: [rowId],
        props: { title: "Our Story Section" },
        styles: {
          base: {
            paddingY: (s.paddingY as string) || "4rem",
            width: "100%",
            backgroundColor: (s.backgroundColor as string) || "var(--color-surface)",
          },
        },
      },
      [rowId]: {
        id: rowId,
        kind: "container",
        component: "flex-container",
        children: [colContentId, colMediaId],
        props: { title: "Story Split Row" },
        styles: {
          base: {
            flexDirection: "row",
            gap: "2.5rem",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            width: "100%",
            padding: "0",
          },
        },
      },
      [colContentId]: {
        id: colContentId,
        kind: "container",
        component: "flex-container",
        children: [eyebrowId, titleId, storyId],
        props: { title: "Story Content Column" },
        styles: {
          base: {
            flexDirection: "column",
            gap: "1rem",
            alignItems: "flex-start",
            flex: "1 1 320px",
            padding: "0",
          },
        },
      },
      [eyebrowId]: {
        id: eyebrowId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: eyebrowText, tag: "span", title: "Story Eyebrow" },
        styles: {
          base: {
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-primary)",
          },
        },
      },
      [titleId]: {
        id: titleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: titleText, tag: "h2", title: "Story Heading (H2)" },
        styles: {
          base: {
            fontSize: "2rem",
            fontWeight: 800,
            lineHeight: 1.25,
            color: "var(--color-text)",
          },
        },
      },
      [storyId]: {
        id: storyId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: storyText, tag: "p", title: "Story Paragraph" },
        styles: {
          base: {
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
          },
        },
      },
      [colMediaId]: {
        id: colMediaId,
        kind: "container",
        component: "flex-container",
        children: [imageId],
        props: { title: "Story Media Column" },
        styles: {
          base: {
            flex: "1 1 320px",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
          },
        },
      },
      [imageId]: {
        id: imageId,
        kind: "element",
        component: "image",
        children: [],
        props: { url: imgUrl, alt: titleText, title: "Story Image Asset" },
        styles: {
          base: {
            aspectRatio: "4/3",
            borderRadius: "var(--shape-card-radius)",
            width: "100%",
            objectFit: "cover",
          },
        },
      },
    };

    return { rootSectionId: secId, primarySelectId: titleId, nodes };
  }

  // 3. PRODUCT / MENU GRID SECTION
  if (componentKey === "product-grid") {
    const secId = customIdPrefix || uid("sec-menu");
    const headerRowId = uid("col-menu-header");
    const titleId = uid("text-menu-title");
    const subId = uid("text-menu-sub");
    const gridId = uid("grid-products");

    const titleText = (p.title as string) || "Signature Loaves & Pastries";
    const subtitleText =
      (p.subtitle as string) ||
      "Hand-crafted using stoneground heritage flours and fermented for 36 hours.";

    // Generate 3 modular product cards
    const card1Id = uid("card-prod-1");
    const img1Id = uid("img-prod-1");
    const title1Id = uid("text-prod-1");
    const price1Id = uid("price-prod-1");
    const btn1Id = uid("btn-prod-1");

    const card2Id = uid("card-prod-2");
    const img2Id = uid("img-prod-2");
    const title2Id = uid("text-prod-2");
    const price2Id = uid("price-prod-2");
    const btn2Id = uid("btn-prod-2");

    const card3Id = uid("card-prod-3");
    const img3Id = uid("img-prod-3");
    const title3Id = uid("text-prod-3");
    const price3Id = uid("price-prod-3");
    const btn3Id = uid("btn-prod-3");

    const nodes: Record<string, PageNode> = {
      [secId]: {
        id: secId,
        kind: "section",
        component: "section",
        children: [headerRowId, gridId],
        props: { title: "Product Grid Section" },
        styles: {
          base: {
            paddingY: (s.paddingY as string) || "4rem",
            width: "100%",
            backgroundColor: (s.backgroundColor as string) || "var(--color-background)",
          },
        },
      },
      [headerRowId]: {
        id: headerRowId,
        kind: "container",
        component: "flex-container",
        children: [titleId, subId],
        props: { title: "Menu Header" },
        styles: {
          base: {
            alignItems: "center",
            textAlign: "center",
            gap: "0.5rem",
            padding: "0 0 2rem 0",
            width: "100%",
          },
        },
      },
      [titleId]: {
        id: titleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: titleText, tag: "h2", title: "Section Heading (H2)" },
        styles: {
          base: { fontSize: "2rem", fontWeight: 800, color: "var(--color-text)" },
        },
      },
      [subId]: {
        id: subId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: subtitleText, tag: "p", title: "Section Subtitle" },
        styles: {
          base: { fontSize: "1rem", color: "var(--color-text-muted)" },
        },
      },
      [gridId]: {
        id: gridId,
        kind: "container",
        component: "grid-container",
        children: [card1Id, card2Id, card3Id],
        props: { title: "Product Cards Grid" },
        styles: {
          base: { columns: 3, gap: "1.5rem", padding: "0" },
        },
      },
      // Card 1
      [card1Id]: {
        id: card1Id,
        kind: "container",
        component: "flex-container",
        children: [img1Id, title1Id, price1Id, btn1Id],
        props: { title: "Product Card 1" },
        styles: {
          base: {
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--shape-card-radius)",
            padding: "1rem",
            gap: "0.75rem",
            border: "1px solid var(--color-border)",
          },
        },
      },
      [img1Id]: {
        id: img1Id,
        kind: "element",
        component: "image",
        children: [],
        props: {
          url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
          alt: "Artisan Sourdough",
          title: "Product Image",
        },
        styles: { base: { aspectRatio: "4/3", borderRadius: "calc(var(--shape-card-radius) - 4px)" } },
      },
      [title1Id]: {
        id: title1Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "Artisan Country Sourdough", tag: "h3", title: "Product Name" },
        styles: { base: { fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" } },
      },
      [price1Id]: {
        id: price1Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "$8.50", tag: "span", title: "Price" },
        styles: { base: { fontSize: "1rem", fontWeight: 800, color: "var(--color-primary)" } },
      },
      [btn1Id]: {
        id: btn1Id,
        kind: "element",
        component: "button",
        children: [],
        props: { label: "Add to Order", url: "/menu", title: "Order Button" },
        styles: {
          base: {
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-contrast)",
            borderRadius: "var(--shape-button-radius)",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 700,
          },
        },
      },
      // Card 2
      [card2Id]: {
        id: card2Id,
        kind: "container",
        component: "flex-container",
        children: [img2Id, title2Id, price2Id, btn2Id],
        props: { title: "Product Card 2" },
        styles: {
          base: {
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--shape-card-radius)",
            padding: "1rem",
            gap: "0.75rem",
            border: "1px solid var(--color-border)",
          },
        },
      },
      [img2Id]: {
        id: img2Id,
        kind: "element",
        component: "image",
        children: [],
        props: {
          url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
          alt: "Almond Croissant",
          title: "Product Image",
        },
        styles: { base: { aspectRatio: "4/3", borderRadius: "calc(var(--shape-card-radius) - 4px)" } },
      },
      [title2Id]: {
        id: title2Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "French Butter Croissant", tag: "h3", title: "Product Name" },
        styles: { base: { fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" } },
      },
      [price2Id]: {
        id: price2Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "$5.25", tag: "span", title: "Price" },
        styles: { base: { fontSize: "1rem", fontWeight: 800, color: "var(--color-primary)" } },
      },
      [btn2Id]: {
        id: btn2Id,
        kind: "element",
        component: "button",
        children: [],
        props: { label: "Add to Order", url: "/menu", title: "Order Button" },
        styles: {
          base: {
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-contrast)",
            borderRadius: "var(--shape-button-radius)",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 700,
          },
        },
      },
      // Card 3
      [card3Id]: {
        id: card3Id,
        kind: "container",
        component: "flex-container",
        children: [img3Id, title3Id, price3Id, btn3Id],
        props: { title: "Product Card 3" },
        styles: {
          base: {
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--shape-card-radius)",
            padding: "1rem",
            gap: "0.75rem",
            border: "1px solid var(--color-border)",
          },
        },
      },
      [img3Id]: {
        id: img3Id,
        kind: "element",
        component: "image",
        children: [],
        props: {
          url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop&q=80",
          alt: "Seeded Rye Loaf",
          title: "Product Image",
        },
        styles: { base: { aspectRatio: "4/3", borderRadius: "calc(var(--shape-card-radius) - 4px)" } },
      },
      [title3Id]: {
        id: title3Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "Nordic Seeded Rye", tag: "h3", title: "Product Name" },
        styles: { base: { fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" } },
      },
      [price3Id]: {
        id: price3Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "$9.00", tag: "span", title: "Price" },
        styles: { base: { fontSize: "1rem", fontWeight: 800, color: "var(--color-primary)" } },
      },
      [btn3Id]: {
        id: btn3Id,
        kind: "element",
        component: "button",
        children: [],
        props: { label: "Add to Order", url: "/menu", title: "Order Button" },
        styles: {
          base: {
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-contrast)",
            borderRadius: "var(--shape-button-radius)",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 700,
          },
        },
      },
    };

    return { rootSectionId: secId, primarySelectId: titleId, nodes };
  }

  // 4. TESTIMONIALS & REVIEWS SECTION
  if (componentKey === "testimonials") {
    const secId = customIdPrefix || uid("sec-testimonials");
    const headerRowId = uid("col-test-header");
    const titleId = uid("text-test-title");
    const subId = uid("text-test-sub");
    const gridId = uid("grid-testimonials");

    const titleText = (p.title as string) || "Loved by Neighborhood Foodies";
    const subText = (p.subtitle as string) || "Hear what our patrons say about our wild sourdough & specialty bakes.";

    const t1Id = uid("card-test-1");
    const q1Id = uid("text-quote-1");
    const a1Id = uid("text-author-1");

    const t2Id = uid("card-test-2");
    const q2Id = uid("text-quote-2");
    const a2Id = uid("text-author-2");

    const nodes: Record<string, PageNode> = {
      [secId]: {
        id: secId,
        kind: "section",
        component: "section",
        children: [headerRowId, gridId],
        props: { title: "Customer Reviews Section" },
        styles: {
          base: {
            paddingY: (s.paddingY as string) || "4rem",
            width: "100%",
            backgroundColor: (s.backgroundColor as string) || "var(--color-surface)",
          },
        },
      },
      [headerRowId]: {
        id: headerRowId,
        kind: "container",
        component: "flex-container",
        children: [titleId, subId],
        props: { title: "Testimonials Header" },
        styles: {
          base: {
            alignItems: "center",
            textAlign: "center",
            gap: "0.5rem",
            padding: "0 0 2rem 0",
            width: "100%",
          },
        },
      },
      [titleId]: {
        id: titleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: titleText, tag: "h2", title: "Reviews Heading" },
        styles: { base: { fontSize: "2rem", fontWeight: 800, color: "var(--color-text)" } },
      },
      [subId]: {
        id: subId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: subText, tag: "p", title: "Reviews Subtitle" },
        styles: { base: { fontSize: "1rem", color: "var(--color-text-muted)" } },
      },
      [gridId]: {
        id: gridId,
        kind: "container",
        component: "grid-container",
        children: [t1Id, t2Id],
        props: { title: "Reviews Grid" },
        styles: { base: { columns: 2, gap: "1.5rem", padding: "0" } },
      },
      // Review 1
      [t1Id]: {
        id: t1Id,
        kind: "container",
        component: "flex-container",
        children: [q1Id, a1Id],
        props: { title: "Review Card 1" },
        styles: {
          base: {
            backgroundColor: "var(--color-background)",
            borderRadius: "var(--shape-card-radius)",
            padding: "1.5rem",
            gap: "1rem",
            border: "1px solid var(--color-border)",
          },
        },
      },
      [q1Id]: {
        id: q1Id,
        kind: "element",
        component: "text",
        children: [],
        props: {
          content: "“The country sourdough crust has the perfect crunch and open crumb. Best bakery in the city!”",
          tag: "p",
          title: "Quote Text",
        },
        styles: { base: { fontSize: "1rem", fontStyle: "italic", lineHeight: 1.6, color: "var(--color-text)" } },
      },
      [a1Id]: {
        id: a1Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "★ ★ ★ ★ ★ — Elena Rostova", tag: "span", title: "Review Author" },
        styles: { base: { fontSize: "0.875rem", fontWeight: 700, color: "var(--color-primary)" } },
      },
      // Review 2
      [t2Id]: {
        id: t2Id,
        kind: "container",
        component: "flex-container",
        children: [q2Id, a2Id],
        props: { title: "Review Card 2" },
        styles: {
          base: {
            backgroundColor: "var(--color-background)",
            borderRadius: "var(--shape-card-radius)",
            padding: "1.5rem",
            gap: "1rem",
            border: "1px solid var(--color-border)",
          },
        },
      },
      [q2Id]: {
        id: q2Id,
        kind: "element",
        component: "text",
        children: [],
        props: {
          content: "“Their almond croissants and single-origin pour-overs are my daily morning ritual.”",
          tag: "p",
          title: "Quote Text",
        },
        styles: { base: { fontSize: "1rem", fontStyle: "italic", lineHeight: 1.6, color: "var(--color-text)" } },
      },
      [a2Id]: {
        id: a2Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "★ ★ ★ ★ ★ — Marcus Vance", tag: "span", title: "Review Author" },
        styles: { base: { fontSize: "0.875rem", fontWeight: 700, color: "var(--color-primary)" } },
      },
    };

    return { rootSectionId: secId, primarySelectId: titleId, nodes };
  }

  // 5. FAQ ACCORDION SECTION
  if (componentKey === "faq-accordion") {
    const secId = customIdPrefix || uid("sec-faq");
    const headerRowId = uid("col-faq-header");
    const titleId = uid("text-faq-title");
    const stackId = uid("stack-faq-items");

    const titleText = (p.title as string) || "Frequently Asked Questions";

    const q1Id = uid("faq-q1");
    const ans1Id = uid("faq-a1");
    const q2Id = uid("faq-q2");
    const ans2Id = uid("faq-a2");

    const nodes: Record<string, PageNode> = {
      [secId]: {
        id: secId,
        kind: "section",
        component: "section",
        children: [headerRowId, stackId],
        props: { title: "FAQ Section" },
        styles: {
          base: {
            paddingY: (s.paddingY as string) || "4rem",
            width: "100%",
            backgroundColor: (s.backgroundColor as string) || "var(--color-background)",
          },
        },
      },
      [headerRowId]: {
        id: headerRowId,
        kind: "container",
        component: "flex-container",
        children: [titleId],
        props: { title: "FAQ Header" },
        styles: { base: { alignItems: "center", textAlign: "center", padding: "0 0 2rem 0", width: "100%" } },
      },
      [titleId]: {
        id: titleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: titleText, tag: "h2", title: "FAQ Title" },
        styles: { base: { fontSize: "2rem", fontWeight: 800, color: "var(--color-text)" } },
      },
      [stackId]: {
        id: stackId,
        kind: "container",
        component: "flex-container",
        children: [q1Id, ans1Id, q2Id, ans2Id],
        props: { title: "FAQ Questions List" },
        styles: {
          base: {
            maxWidth: "768px",
            margin: "0 auto",
            gap: "1rem",
            width: "100%",
            padding: "0",
          },
        },
      },
      [q1Id]: {
        id: q1Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "Do you offer oat and almond milk alternatives?", tag: "h3", title: "Question 1" },
        styles: { base: { fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" } },
      },
      [ans1Id]: {
        id: ans1Id,
        kind: "element",
        component: "text",
        children: [],
        props: {
          content: "Yes, we steam organic oat and almond milk at no extra charge.",
          tag: "p",
          title: "Answer 1",
        },
        styles: {
          base: {
            fontSize: "0.95rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            padding: "0 0 1rem 0",
            borderBottom: "1px solid var(--color-border)",
          },
        },
      },
      [q2Id]: {
        id: q2Id,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "Can I pre-order custom loaves or pastry platters?", tag: "h3", title: "Question 2" },
        styles: { base: { fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" } },
      },
      [ans2Id]: {
        id: ans2Id,
        kind: "element",
        component: "text",
        children: [],
        props: {
          content: "Absolutely! Give us 24-hour notice via our contact form or phone call.",
          tag: "p",
          title: "Answer 2",
        },
        styles: {
          base: {
            fontSize: "0.95rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            padding: "0 0 1rem 0",
            borderBottom: "1px solid var(--color-border)",
          },
        },
      },
    };

    return { rootSectionId: secId, primarySelectId: titleId, nodes };
  }

  // 6. CONTACT & FEEDBACK FORM SECTION
  if (componentKey === "contact-form") {
    const secId = customIdPrefix || uid("sec-contact");
    const headerRowId = uid("col-contact-header");
    const titleId = uid("text-contact-title");
    const subId = uid("text-contact-sub");
    const formBoxId = uid("box-contact-form");
    const namePromptId = uid("text-name-prompt");
    const emailPromptId = uid("text-email-prompt");
    const submitBtnId = uid("btn-contact-submit");

    const titleText = (p.title as string) || "Catering & Special Orders";
    const subText =
      (p.subtitle as string) || "Need fresh bread or custom pastry platters for your event? Reach out to our bakers.";

    const nodes: Record<string, PageNode> = {
      [secId]: {
        id: secId,
        kind: "section",
        component: "section",
        children: [headerRowId, formBoxId],
        props: { title: "Contact Section" },
        styles: {
          base: {
            paddingY: (s.paddingY as string) || "4rem",
            width: "100%",
            backgroundColor: (s.backgroundColor as string) || "var(--color-surface)",
          },
        },
      },
      [headerRowId]: {
        id: headerRowId,
        kind: "container",
        component: "flex-container",
        children: [titleId, subId],
        props: { title: "Contact Header" },
        styles: { base: { alignItems: "center", textAlign: "center", gap: "0.5rem", padding: "0 0 2rem 0", width: "100%" } },
      },
      [titleId]: {
        id: titleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: titleText, tag: "h2", title: "Contact Heading" },
        styles: { base: { fontSize: "2rem", fontWeight: 800, color: "var(--color-text)" } },
      },
      [subId]: {
        id: subId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: subText, tag: "p", title: "Contact Subtitle" },
        styles: { base: { fontSize: "1rem", color: "var(--color-text-muted)" } },
      },
      [formBoxId]: {
        id: formBoxId,
        kind: "container",
        component: "flex-container",
        children: [namePromptId, emailPromptId, submitBtnId],
        props: { title: "Contact Form Box" },
        styles: {
          base: {
            maxWidth: "520px",
            margin: "0 auto",
            backgroundColor: "var(--color-background)",
            borderRadius: "var(--shape-card-radius)",
            padding: "2rem",
            gap: "1.25rem",
            border: "1px solid var(--color-border)",
            width: "100%",
          },
        },
      },
      [namePromptId]: {
        id: namePromptId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "Full Name & Organization", tag: "p", title: "Name Field Label" },
        styles: { base: { fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" } },
      },
      [emailPromptId]: {
        id: emailPromptId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "Email Address: orders@yourdomain.com", tag: "p", title: "Email Field Label" },
        styles: { base: { fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-muted)" } },
      },
      [submitBtnId]: {
        id: submitBtnId,
        kind: "element",
        component: "button",
        children: [],
        props: { label: "Send Message", url: "#", title: "Submit Button" },
        styles: {
          base: {
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-contrast)",
            borderRadius: "var(--shape-button-radius)",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            textAlign: "center",
          },
        },
      },
    };

    return { rootSectionId: secId, primarySelectId: titleId, nodes };
  }

  // 7. RESERVATION BOOKING WIDGET SECTION
  if (componentKey === "reservation-widget") {
    const secId = customIdPrefix || uid("sec-reserve");
    const headerRowId = uid("col-res-header");
    const titleId = uid("text-res-title");
    const subId = uid("text-res-sub");
    const boxId = uid("box-res-details");
    const timeTextId = uid("text-res-time");
    const btnId = uid("btn-res-action");

    const titleText = (p.title as string) || "Book a Table or Meeting Corner";
    const subText = (p.subtitle as string) || "Reserve seating for group discussions or quiet work sessions.";

    const nodes: Record<string, PageNode> = {
      [secId]: {
        id: secId,
        kind: "section",
        component: "section",
        children: [headerRowId, boxId],
        props: { title: "Reservation Section" },
        styles: {
          base: {
            paddingY: (s.paddingY as string) || "4rem",
            width: "100%",
            backgroundColor: (s.backgroundColor as string) || "var(--color-background)",
          },
        },
      },
      [headerRowId]: {
        id: headerRowId,
        kind: "container",
        component: "flex-container",
        children: [titleId, subId],
        props: { title: "Reservation Header" },
        styles: { base: { alignItems: "center", textAlign: "center", gap: "0.5rem", padding: "0 0 2rem 0", width: "100%" } },
      },
      [titleId]: {
        id: titleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: titleText, tag: "h2", title: "Reservation Title" },
        styles: { base: { fontSize: "2rem", fontWeight: 800, color: "var(--color-text)" } },
      },
      [subId]: {
        id: subId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: subText, tag: "p", title: "Reservation Subtitle" },
        styles: { base: { fontSize: "1rem", color: "var(--color-text-muted)" } },
      },
      [boxId]: {
        id: boxId,
        kind: "container",
        component: "flex-container",
        children: [timeTextId, btnId],
        props: { title: "Booking Box" },
        styles: {
          base: {
            maxWidth: "480px",
            margin: "0 auto",
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--shape-card-radius)",
            padding: "2rem",
            gap: "1.25rem",
            border: "1px solid var(--color-border)",
            textAlign: "center",
            width: "100%",
          },
        },
      },
      [timeTextId]: {
        id: timeTextId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: "Open Daily 8:00 AM – 10:00 PM • Seating up to 8 Guests", tag: "p", title: "Hours Notice" },
        styles: { base: { fontSize: "0.95rem", color: "var(--color-text)" } },
      },
      [btnId]: {
        id: btnId,
        kind: "element",
        component: "button",
        children: [],
        props: { label: "Confirm Table Reservation", url: "/reservations", title: "Reserve CTA" },
        styles: {
          base: {
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-contrast)",
            borderRadius: "var(--shape-button-radius)",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 700,
          },
        },
      },
    };

    return { rootSectionId: secId, primarySelectId: titleId, nodes };
  }

  // 8. NEWSLETTER SIGNUP SECTION
  if (componentKey === "newsletter") {
    const secId = customIdPrefix || uid("sec-newsletter");
    const boxId = uid("box-news-content");
    const titleId = uid("text-news-title");
    const subId = uid("text-news-sub");
    const btnId = uid("btn-news-submit");

    const titleText = (p.title as string) || "Subscribe for Seasonal Drops & Secret Bakes";
    const subText = (p.subtitle as string) || "Join 4,000+ local foodies receiving weekly menus and private tasting invitations.";

    const nodes: Record<string, PageNode> = {
      [secId]: {
        id: secId,
        kind: "section",
        component: "section",
        children: [boxId],
        props: { title: "Newsletter Section" },
        styles: {
          base: {
            paddingY: (s.paddingY as string) || "4rem",
            width: "100%",
            backgroundColor: (s.backgroundColor as string) || "var(--color-surface)",
          },
        },
      },
      [boxId]: {
        id: boxId,
        kind: "container",
        component: "flex-container",
        children: [titleId, subId, btnId],
        props: { title: "Newsletter Box" },
        styles: {
          base: {
            maxWidth: "600px",
            margin: "0 auto",
            alignItems: "center",
            textAlign: "center",
            gap: "1rem",
            padding: "0",
            width: "100%",
          },
        },
      },
      [titleId]: {
        id: titleId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: titleText, tag: "h2", title: "Newsletter Heading" },
        styles: { base: { fontSize: "1.875rem", fontWeight: 800, color: "var(--color-text)" } },
      },
      [subId]: {
        id: subId,
        kind: "element",
        component: "text",
        children: [],
        props: { content: subText, tag: "p", title: "Newsletter Subtitle" },
        styles: { base: { fontSize: "1rem", color: "var(--color-text-muted)" } },
      },
      [btnId]: {
        id: btnId,
        kind: "element",
        component: "button",
        children: [],
        props: { label: "Subscribe Now", url: "#", title: "Subscribe Button" },
        styles: {
          base: {
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-contrast)",
            borderRadius: "var(--shape-button-radius)",
            padding: "0.75rem 2rem",
            fontSize: "0.875rem",
            fontWeight: 700,
          },
        },
      },
    };

    return { rootSectionId: secId, primarySelectId: titleId, nodes };
  }

  // 9. DEFAULT / BLANK SECTION
  const secId = customIdPrefix || uid("sec-custom");
  const containerId = uid("container-custom");
  const titleId = uid("text-heading");

  const nodes: Record<string, PageNode> = {
    [secId]: {
      id: secId,
      kind: "section",
      component: "section",
      children: [containerId],
      props: { title: (p.title as string) || "Custom Section" },
      styles: {
        base: {
          paddingY: (s.paddingY as string) || "4rem",
          width: "100%",
          backgroundColor: (s.backgroundColor as string) || "var(--color-background)",
        },
      },
    },
    [containerId]: {
      id: containerId,
      kind: "container",
      component: "flex-container",
      children: [titleId],
      props: { title: "Section Container" },
      styles: {
        base: {
          flexDirection: "column",
          gap: "1.5rem",
          padding: "1.5rem",
          alignItems: "stretch",
          width: "100%",
        },
      },
    },
    [titleId]: {
      id: titleId,
      kind: "element",
      component: "text",
      children: [],
      props: { content: (p.title as string) || "New Section Heading", tag: "h2", title: "Heading" },
      styles: { base: { fontSize: "2rem", fontWeight: 800, color: "var(--color-text)" } },
    },
  };

  return { rootSectionId: secId, primarySelectId: titleId, nodes };
}

/**
 * Normalizes an entire PageDocument, converting any monolithic sections (e.g. from templates or older saves)
 * into fully modular, granular AST subtrees where every child element is individually selectable & editable.
 */
export function normalizeDocumentToModularAST(doc: PageDocument): PageDocument {
  if (!doc || !doc.nodes || !doc.rootNodeId) return doc;

  const newNodes: Record<string, PageNode> = { ...doc.nodes };
  let hasModified = false;

  const monolithicKeys = [
    "hero",
    "story-about",
    "product-grid",
    "testimonials",
    "faq-accordion",
    "contact-form",
    "reservation-widget",
    "newsletter",
  ];

  for (const [nodeId, node] of Object.entries(doc.nodes)) {
    // Detect monolithic section nodes that have 0 children
    if (
      node.kind === "section" &&
      monolithicKeys.includes(node.component) &&
      (!node.children || node.children.length === 0)
    ) {
      hasModified = true;
      const modular = generateModularSection(
        node.component,
        node.props || {},
        node.styles?.base || {},
        node.id // Preserve original section ID so parent references remain intact
      );

      // Merge generated modular sub-nodes into document
      Object.assign(newNodes, modular.nodes);
    }
  }

  if (!hasModified) return doc;

  return {
    ...doc,
    nodes: newNodes,
  };
}
