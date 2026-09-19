/**
 * SmartStore Website Studio (CMS V3) — Universal Page Tree Renderer
 * Shared component tree resolution engine used by Editor Canvas & Public Storefront
 * In Editor mode, transparently wraps interactive nodes with EditorNodeWrapper for selection, hover, toolbars, and drag & drop.
 */

import React from "react";
import { PageDocument, PageNode, RenderContext } from "../types/cms-v3";
import { isNodeVisible } from "./visibility";
import { EditorNodeWrapper } from "../editor/EditorNodeWrapper";
import { DraggedItem, DropPosition } from "../editor/drag-drop/dragContext";
import { HeroSection } from "../registry/sections/HeroSection";
import {
  FlexContainer,
  GridContainer,
  TextAtom,
  ButtonAtom,
  ImageAtom,
  IconAtom,
  DividerAtom,
  SpacerAtom,
} from "../registry/primitives/ContainerPrimitives";
import {
  ProductGridSection,
  StoryAboutSection,
  FaqAccordionSection,
  TestimonialsSection,
} from "../registry/content/ContentSections";
import {
  ContactFormSection,
  LocationMapSection,
  ReservationWidgetSection,
} from "../registry/forms/FormSections";
import { HeaderSection } from "../registry/navigation/HeaderSection";
import { FooterSection } from "../registry/navigation/FooterSection";
import { AnnouncementBarSection } from "../registry/navigation/AnnouncementBarSection";
import { BreadcrumbsSection } from "../registry/navigation/BreadcrumbsSection";
import { VideoPlayerSection } from "../registry/media/VideoPlayerSection";
import { RichTextSection } from "../registry/content/RichTextSection";
import { PopupModalSection } from "../registry/marketing/PopupModalSection";
import { CountdownSection } from "../registry/marketing/CountdownSection";
import { NewsletterSection } from "../registry/marketing/NewsletterSection";
import { ReviewCarouselSection } from "../registry/social/ReviewCarouselSection";
import { MasonryGallerySection } from "../registry/media/MasonryGallerySection";
import { CollectionListSection } from "../registry/collections/CollectionListSection";
import { CartDrawerSection } from "../registry/commerce/CartDrawerSection";
import { ProductSpotlightSection } from "../registry/commerce/ProductSpotlightSection";
import { DietaryFiltersSection } from "../registry/commerce/DietaryFiltersSection";

interface UniversalRendererProps {
  nodeId: string;
  document: PageDocument;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
  onHoverNode?: (nodeId: string | null) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onMoveNodeUp?: (nodeId: string) => void;
  onMoveNodeDown?: (nodeId: string) => void;
  onSelectParent?: (nodeId: string) => void;
  onAddChild?: (nodeId: string) => void;
  onUpdateTextContent?: (nodeId: string, newText: string) => void;
  onDropNode?: (item: DraggedItem, targetNodeId: string, position: DropPosition) => void;
}

export function UniversalRenderer({
  nodeId,
  document,
  context,
  onSelectNode,
  selectedNodeId,
  hoveredNodeId,
  onHoverNode,
  onDeleteNode,
  onDuplicateNode,
  onMoveNodeUp,
  onMoveNodeDown,
  onSelectParent,
  onAddChild,
  onUpdateTextContent,
  onDropNode,
}: UniversalRendererProps) {
  if (!document || !document.nodes) return null;

  const node: PageNode = document.nodes[nodeId];
  if (!node) return null;

  // Enforce per-device visibility in editor/preview/public runtime paths
  if (!isNodeVisible(node, context.device)) {
    return null;
  }

  const isSelected = selectedNodeId === node.id;
  const isHovered = hoveredNodeId === node.id;

  // Recursively render children nodes
  const childrenNodes = (node.children || []).map((childId) => (
    <UniversalRenderer
      key={childId}
      nodeId={childId}
      document={document}
      context={context}
      onSelectNode={onSelectNode}
      selectedNodeId={selectedNodeId}
      hoveredNodeId={hoveredNodeId}
      onHoverNode={onHoverNode}
      onDeleteNode={onDeleteNode}
      onDuplicateNode={onDuplicateNode}
      onMoveNodeUp={onMoveNodeUp}
      onMoveNodeDown={onMoveNodeDown}
      onSelectParent={onSelectParent}
      onAddChild={onAddChild}
      onUpdateTextContent={onUpdateTextContent}
      onDropNode={onDropNode}
    />
  ));

  // Render raw component
  let innerComponent: React.ReactNode = null;

  switch (node.component) {
    case "hero":
      innerComponent = <HeroSection node={node} context={context} childrenNodes={childrenNodes} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "flex-container":
    case "section":
      innerComponent = <FlexContainer node={node} context={context} childrenNodes={childrenNodes} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "grid-container":
      innerComponent = <GridContainer node={node} context={context} childrenNodes={childrenNodes} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "text":
      innerComponent = <TextAtom node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "button":
      innerComponent = <ButtonAtom node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "image":
      innerComponent = <ImageAtom node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "icon":
      innerComponent = <IconAtom node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "divider":
      innerComponent = <DividerAtom node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "spacer":
      innerComponent = <SpacerAtom node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "product-grid":
      innerComponent = <ProductGridSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "story-about":
      innerComponent = <StoryAboutSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "faq-accordion":
      innerComponent = <FaqAccordionSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "testimonials":
      innerComponent = <TestimonialsSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "contact-form":
      innerComponent = <ContactFormSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "location-map":
      innerComponent = <LocationMapSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "reservation-widget":
      innerComponent = <ReservationWidgetSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "header":
      innerComponent = <HeaderSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "footer":
      innerComponent = <FooterSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "announcement-bar":
      innerComponent = <AnnouncementBarSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "breadcrumbs":
      innerComponent = <BreadcrumbsSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "video":
      innerComponent = <VideoPlayerSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "rich-text":
      innerComponent = <RichTextSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "popup-modal":
      innerComponent = <PopupModalSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "countdown":
      innerComponent = <CountdownSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "newsletter":
      innerComponent = <NewsletterSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "review-carousel":
      innerComponent = <ReviewCarouselSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "masonry-gallery":
      innerComponent = <MasonryGallerySection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "collection-list":
      innerComponent = <CollectionListSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "cart-drawer":
      innerComponent = <CartDrawerSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "product-spotlight":
      innerComponent = <ProductSpotlightSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "dietary-filters":
      innerComponent = <DietaryFiltersSection node={node} context={context} onSelectNode={onSelectNode} isSelected={isSelected} />;
      break;
    case "page":
      return <div className="cms-page-root">{childrenNodes}</div>;
    default:
      innerComponent = (
        <div className="p-2 border border-red-300 text-xs text-red-500">
          Unknown component: {node.component}
        </div>
      );
  }

  const scopedOutput = (
    <div data-cms-node={node.id} className="cms-node-scope" style={{ display: "contents" }}>
      {innerComponent}
    </div>
  );

  // In Editor mode, wrap with Elementor/Webflow grade interactive wrapper
  if (context.mode === "editor" && node.kind !== "page") {
    return (
      <EditorNodeWrapper
        node={node}
        context={context}
        isSelected={isSelected}
        isHovered={isHovered}
        onSelect={(id) => onSelectNode && onSelectNode(id)}
        onHover={(id) => onHoverNode && onHoverNode(id)}
        onDelete={(id) => onDeleteNode && onDeleteNode(id)}
        onDuplicate={(id) => onDuplicateNode && onDuplicateNode(id)}
        onMoveUp={(id) => onMoveNodeUp && onMoveNodeUp(id)}
        onMoveDown={(id) => onMoveNodeDown && onMoveNodeDown(id)}
        onSelectParent={(id) => onSelectParent && onSelectParent(id)}
        onAddChild={(id) => onAddChild && onAddChild(id)}
        onUpdateTextContent={(id, txt) => onUpdateTextContent && onUpdateTextContent(id, txt)}
        onDropItem={(item, targetId, pos) => onDropNode && onDropNode(item, targetId, pos)}
      >
        {scopedOutput}
      </EditorNodeWrapper>
    );
  }

  return scopedOutput;
}
