/**
 * SmartStore Website Studio (CMS V3) — Store-Safe Navigation Link Validator
 */

const db = require('../config/database');

class CmsV3NavigationValidator {
  /**
   * Validates an entire navigation items tree for store safety, protocol security, and dropdown depth limits
   */
  static async validateNavigationTree(items, storeId, currentDepth = 1, visitedIds = new Set()) {
    const warnings = [];
    const errors = [];

    if (currentDepth > 3) {
      errors.push({ code: 'EXCESSIVE_DEPTH', message: 'Navigation dropdown depth exceeds maximum limit of 3 levels.' });
      return { isValid: false, errors, warnings };
    }

    if (!Array.isArray(items)) return { isValid: true, errors: [], warnings: [] };

    for (const item of items) {
      if (!item || !item.id) continue;

      if (visitedIds.has(item.id)) {
        errors.push({ code: 'CIRCULAR_LOOP', message: `Circular navigation reference detected for item '${item.label || item.id}'.` });
        continue;
      }
      visitedIds.add(item.id);

      // Validate URL protocols
      if (item.href) {
        const hrefLower = item.href.trim().toLowerCase();
        if (hrefLower.startsWith('javascript:') || hrefLower.startsWith('data:')) {
          errors.push({ code: 'UNSAFE_PROTOCOL', message: `Unsafe URL protocol rejected in item '${item.label}': ${item.href}` });
        } else if (hrefLower.startsWith('http://') || hrefLower.startsWith('https://')) {
          // Check external URL
          if (!hrefLower.startsWith('http://') && !hrefLower.startsWith('https://') && !hrefLower.startsWith('mailto:') && !hrefLower.startsWith('tel:')) {
            errors.push({ code: 'INVALID_PROTOCOL', message: `Invalid protocol in item '${item.label}'` });
          }
        }
      }

      // Validate internal page references
      if (item.type === 'page' && item.pageId) {
        const pageRes = await db.query(
          `SELECT id, store_id, title, is_published, published_version_id FROM cms_v3_pages WHERE id = $1`,
          [item.pageId]
        );
        const targetPage = pageRes.rows[0];

        if (!targetPage) {
          warnings.push({ code: 'MISSING_PAGE', message: `Target page for item '${item.label}' does not exist.` });
        } else if (targetPage.store_id !== storeId) {
          errors.push({ code: 'CROSS_STORE_LINK', message: `Item '${item.label}' targets a page belonging to a different store.` });
        } else if (!targetPage.is_published || !targetPage.published_version_id) {
          warnings.push({ code: 'UNPUBLISHED_PAGE', message: `Target page '${targetPage.title}' for item '${item.label}' is currently unpublished.` });
        }
      }

      // Recursively validate dropdown children
      if (Array.isArray(item.children) && item.children.length > 0) {
        const childRes = await this.validateNavigationTree(item.children, storeId, currentDepth + 1, visitedIds);
        errors.push(...childRes.errors);
        warnings.push(...childRes.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = CmsV3NavigationValidator;
