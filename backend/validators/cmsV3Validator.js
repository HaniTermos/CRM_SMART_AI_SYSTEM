/**
 * SmartStore Website Studio (CMS V3) — Backend Server-Side Validation Suite
 */

const ALLOWED_NODE_KINDS = new Set(['page', 'section', 'container', 'element', 'global-symbol']);
const ALLOWED_STATES = new Set(['hover', 'focus', 'active', 'disabled', 'scrolled']);
const ALLOWED_ANIMATION_TYPES = new Set([
  'fade-in', 'slide-up', 'slide-down', 'slide-left', 'slide-right',
  'zoom-in', 'flip-up', 'bounce', 'blur-in', 'hover-lift', 'hover-scale'
]);
const ALLOWED_TRIGGERS = new Set(['click', 'hover', 'viewport_enter']);
const ALLOWED_ACTIONS = new Set([
  'scroll_to_anchor', 'open_modal', 'trigger_quick_order',
  'toggle_accordion', 'copy_text', 'open_url'
]);

const REJECTED_ANIMATION_PROPERTIES = new Set([
  'width', 'height', 'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'top', 'left', 'right', 'bottom', 'flex-basis'
]);

const SCRIPT_PATTERN = /<script\b[^>]*>([\s\S]*?)<\/script>|javascript:|onload\s*=|onerror\s*=/i;
const UNSAFE_URL_PATTERN = /^\s*(javascript|data|vbscript):/i;
const CSS_CLASS_TOKEN_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const URL_PROP_KEYS = new Set(['url', 'href', 'src', 'link', 'primaryCtaLink', 'secondaryCtaLink', 'imageUrl', 'videoUrl']);

const MAX_DEPTH = 15;
const MAX_NODES = 500;
const MAX_TEXT_LENGTH = 50000;

function validatePageDocument(doc) {
  const errors = [];

  if (!doc || typeof doc !== 'object') {
    errors.push({ path: '$', code: 'INVALID_DOCUMENT', message: 'Document must be a valid object.', severity: 'error' });
    return errors;
  }

  if (!doc.rootNodeId || typeof doc.rootNodeId !== 'string') {
    errors.push({ path: '$.rootNodeId', code: 'MISSING_ROOT', message: 'Document must specify a valid rootNodeId.', severity: 'error' });
    return errors;
  }

  if (!doc.nodes || typeof doc.nodes !== 'object') {
    errors.push({ path: '$.nodes', code: 'MISSING_NODES', message: 'Document must contain a nodes dictionary.', severity: 'error' });
    return errors;
  }

  const rootNode = doc.nodes[doc.rootNodeId];
  if (!rootNode) {
    errors.push({ path: `$.nodes.${doc.rootNodeId}`, code: 'ROOT_NODE_NOT_FOUND', message: `Root node '${doc.rootNodeId}' does not exist in nodes dictionary.`, severity: 'error' });
    return errors;
  }

  const nodeIds = Object.keys(doc.nodes);
  if (nodeIds.length > MAX_NODES) {
    errors.push({ path: '$.nodes', code: 'EXCESSIVE_NODES', message: `Document node count (${nodeIds.length}) exceeds maximum limit of ${MAX_NODES}.`, severity: 'error' });
  }

  const referencedChildren = new Set();
  Object.entries(doc.nodes).forEach(([id, node]) => {
    if (!ALLOWED_NODE_KINDS.has(node.kind)) {
      errors.push({ path: `$.nodes.${id}.kind`, code: 'INVALID_NODE_KIND', message: `Invalid node kind '${node.kind}'.`, severity: 'error' });
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(childId => {
        if (referencedChildren.has(childId)) {
          errors.push({ path: `$.nodes.${id}.children`, code: 'MULTIPLE_PARENTS', message: `Child node '${childId}' is referenced by multiple parent nodes.`, severity: 'error' });
        }
        referencedChildren.add(childId);
      });
    }
  });

  nodeIds.forEach(id => {
    if (id !== doc.rootNodeId && !referencedChildren.has(id)) {
      errors.push({ path: `$.nodes.${id}`, code: 'ORPHAN_NODE', message: `Node '${id}' is an orphan.`, severity: 'warning' });
    }
  });

  const visited = new Set();
  const activeStack = new Set();

  function traverse(nodeId, currentDepth) {
    if (currentDepth > MAX_DEPTH) {
      errors.push({ path: `$.nodes.${nodeId}`, code: 'EXCESSIVE_DEPTH', message: `Document tree depth exceeds maximum limit of ${MAX_DEPTH}.`, severity: 'error' });
      return;
    }

    if (activeStack.has(nodeId)) {
      errors.push({ path: `$.nodes.${nodeId}`, code: 'CIRCULAR_REFERENCE', message: `Circular relationship detected involving node '${nodeId}'.`, severity: 'error' });
      return;
    }

    const node = doc.nodes[nodeId];
    if (!node) {
      errors.push({ path: `$.nodes.${nodeId}`, code: 'MISSING_CHILD_NODE', message: `Referenced child node '${nodeId}' does not exist.`, severity: 'error' });
      return;
    }

    visited.add(nodeId);
    activeStack.add(nodeId);

    validateNode(node, `$.nodes.${nodeId}`, errors, doc);

    if (Array.isArray(node.children)) {
      node.children.forEach(childId => traverse(childId, currentDepth + 1));
    }

    activeStack.delete(nodeId);
  }

  traverse(doc.rootNodeId, 1);

  return errors;
}

function isSafeUrl(value) {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (UNSAFE_URL_PATTERN.test(trimmed)) return false;
  if (SCRIPT_PATTERN.test(trimmed)) return false;
  return true;
}

function validateCustomClasses(value) {
  if (typeof value !== 'string' || !value.trim()) return true;
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  return tokens.every((token) => CSS_CLASS_TOKEN_PATTERN.test(token));
}

function validateNode(node, path, errors, doc) {
  if (node.props && typeof node.props === 'object') {
    Object.entries(node.props).forEach(([propKey, propVal]) => {
      if (typeof propVal === 'string') {
        if (propVal.length > MAX_TEXT_LENGTH) {
          errors.push({ path: `${path}.props.${propKey}`, code: 'TEXT_TOO_LONG', message: `Text prop '${propKey}' exceeds maximum length of ${MAX_TEXT_LENGTH}.`, severity: 'error' });
        }
        if (SCRIPT_PATTERN.test(propVal)) {
          errors.push({ path: `${path}.props.${propKey}`, code: 'UNSAFE_SCRIPT_INJECTION', message: `Unsafe script payload detected in prop '${propKey}'.`, severity: 'error' });
        }
        if (URL_PROP_KEYS.has(propKey) && !isSafeUrl(propVal)) {
          errors.push({ path: `${path}.props.${propKey}`, code: 'UNSAFE_URL', message: `Unsafe URL protocol in prop '${propKey}'.`, severity: 'error' });
        }
        if (propKey === 'customClasses' && !validateCustomClasses(propVal)) {
          errors.push({ path: `${path}.props.${propKey}`, code: 'INVALID_CSS_CLASSES', message: `Invalid CSS class token in customClasses.`, severity: 'error' });
        }
      }
    });
  }

  if (node.styles && node.styles.states) {
    Object.keys(node.styles.states).forEach(stateKey => {
      if (!ALLOWED_STATES.has(stateKey)) {
        errors.push({ path: `${path}.styles.states.${stateKey}`, code: 'INVALID_STATE', message: `Unsupported state '${stateKey}'.`, severity: 'error' });
      }
    });
  }

  if (node.behaviors) {
    validateBehaviors(node.behaviors, `${path}.behaviors`, errors, doc);
  }
}

function validateBehaviors(behaviors, path, errors, doc) {
  if (behaviors.entrance) {
    const e = behaviors.entrance;
    if (!ALLOWED_ANIMATION_TYPES.has(e.type)) {
      errors.push({ path: `${path}.entrance.type`, code: 'INVALID_ANIMATION_PRESET', message: `Unsupported animation type '${e.type}'.`, severity: 'error' });
    }
    if (typeof e.durationMs === 'number' && (e.durationMs < 100 || e.durationMs > 2000)) {
      errors.push({ path: `${path}.entrance.durationMs`, code: 'INVALID_DURATION', message: `Animation durationMs must be between 100 and 2000.`, severity: 'error' });
    }
    if (typeof e.delayMs === 'number' && (e.delayMs < 0 || e.delayMs > 3000)) {
      errors.push({ path: `${path}.entrance.delayMs`, code: 'INVALID_DELAY', message: `Animation delayMs must be between 0 and 3000.`, severity: 'error' });
    }
    if (typeof e.staggerIndex === 'number' && (e.staggerIndex < 0 || e.staggerIndex > 50)) {
      errors.push({ path: `${path}.entrance.staggerIndex`, code: 'INVALID_STAGGER', message: `Animation staggerIndex must be between 0 and 50.`, severity: 'error' });
    }
  }

  if (behaviors.interactions && Array.isArray(behaviors.interactions)) {
    behaviors.interactions.forEach((rule, idx) => {
      if (!ALLOWED_TRIGGERS.has(rule.trigger)) {
        errors.push({ path: `${path}.interactions[${idx}].trigger`, code: 'INVALID_TRIGGER', message: `Unsupported trigger '${rule.trigger}'.`, severity: 'error' });
      }
      if (!ALLOWED_ACTIONS.has(rule.action)) {
        errors.push({ path: `${path}.interactions[${idx}].action`, code: 'INVALID_ACTION', message: `Unsupported action '${rule.action}'.`, severity: 'error' });
      }
      if (rule.targetId && !doc.nodes[rule.targetId]) {
        errors.push({ path: `${path}.interactions[${idx}].targetId`, code: 'INVALID_TARGET_NODE', message: `Target node ID '${rule.targetId}' does not exist.`, severity: 'error' });
      }
    });
  }
}

function isSafeCssProperty(propertyName) {
  if (REJECTED_ANIMATION_PROPERTIES.has(String(propertyName).toLowerCase())) {
    return false;
  }
  return true;
}

module.exports = {
  validatePageDocument,
  isSafeCssProperty,
  isSafeUrl,
  validateCustomClasses,
  ALLOWED_STATES,
  ALLOWED_ANIMATION_TYPES,
  ALLOWED_TRIGGERS,
  ALLOWED_ACTIONS
};
