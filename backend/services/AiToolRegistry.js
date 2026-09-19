const db = require('../config/database');

const AI_TOOLS = {
  update_product_stock: {
    name: 'update_product_stock',
    description: 'Adjust product stock in inventory',
    classification: 'reversible',
    execute: async (store_id, payload) => {
      const { product_id, delta, reason = 'AI Adjustment' } = payload;
      const prod = await db.query(`SELECT stock FROM products WHERE id = $1 AND store_id = $2`, [product_id, store_id]);
      if (prod.rows.length === 0) throw new Error('Product not found');
      
      const oldStock = prod.rows[0].stock;
      const newStock = Math.max(0, oldStock + delta);

      await db.query(`UPDATE products SET stock = $3 WHERE id = $1 AND store_id = $2`, [product_id, store_id, newStock]);
      await db.query(
        `INSERT INTO inventory_adjustments (store_id, product_id, delta, reason, note) VALUES ($1, $2, $3, $4, $5)`,
        [store_id, product_id, delta, reason, `Adjusted from ${oldStock} to ${newStock}`]
      );

      return {
        product_id,
        old_stock: oldStock,
        new_stock: newStock,
        compensation: { type: 'update_product_stock', payload: { product_id, delta: -delta, reason: 'Compensation Rollback' } }
      };
    }
  },

  create_discount_code: {
    name: 'create_discount_code',
    description: 'Create a promotional discount code',
    classification: 'reversible',
    execute: async (store_id, payload) => {
      const { code, discount_type = 'percentage', value = 10, min_order_amount = 0 } = payload;
      const res = await db.query(
        `INSERT INTO discount_codes (store_id, code, discount_type, value, min_order_amount, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (store_id, code) DO UPDATE SET is_active = TRUE
         RETURNING *`,
        [store_id, code.toUpperCase(), discount_type, value, min_order_amount]
      );

      return {
        discount_code_id: res.rows[0].id,
        code: res.rows[0].code,
        compensation: { type: 'deactivate_discount_code', payload: { discount_code_id: res.rows[0].id } }
      };
    }
  },

  deactivate_discount_code: {
    name: 'deactivate_discount_code',
    description: 'Deactivate a discount code',
    classification: 'reversible',
    execute: async (store_id, payload) => {
      const { discount_code_id } = payload;
      await db.query(`UPDATE discount_codes SET is_active = FALSE WHERE id = $1 AND store_id = $2`, [discount_code_id, store_id]);
      return { discount_code_id, status: 'deactivated' };
    }
  },

  publish_cms_theme: {
    name: 'publish_cms_theme',
    description: 'Publish a CMS theme version',
    classification: 'partially_reversible',
    execute: async (store_id, payload) => {
      const { version_id } = payload;
      const CmsThemeAssignment = require('../models/CmsThemeAssignment');
      const published = await CmsThemeAssignment.publishVersion(store_id, version_id);
      return { published_version_id: published.id, version: published.version };
    }
  }
};

class AiToolRegistry {
  static getTool(type) {
    return AI_TOOLS[type] || null;
  }

  static listTools() {
    return Object.values(AI_TOOLS).map(t => ({
      name: t.name,
      description: t.description,
      classification: t.classification
    }));
  }
}

module.exports = AiToolRegistry;
