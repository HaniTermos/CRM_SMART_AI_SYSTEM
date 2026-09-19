const db = require('../config/database');

class Floor {
  static async create({ store_id, name, order_index = 0 }) {
    const result = await db.query(
      `INSERT INTO floors (store_id, name, order_index) VALUES ($1, $2, $3) RETURNING *`,
      [store_id, name, order_index]
    );
    return result.rows[0];
  }

  static async findByStore(storeId) {
    const result = await db.query(
      `SELECT * FROM floors WHERE store_id = $1 ORDER BY order_index ASC, created_at ASC`,
      [storeId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(`SELECT * FROM floors WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  static async update(id, storeId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && !['id', 'created_at', 'store_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      const result = await db.query('SELECT * FROM floors WHERE id = $1 AND store_id = $2', [id, storeId]);
      return result.rows[0] || null;
    }

    values.push(id, storeId);

    const result = await db.query(
      `UPDATE floors SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(`DELETE FROM floors WHERE id = $1 AND store_id = $2 RETURNING *`, [id, storeId]);
    return result.rows[0] || null;
  }

  static async createLayout({ floor_id, name, is_default = false }) {
    const result = await db.query(
      `INSERT INTO floor_layouts (floor_id, name, is_default) VALUES ($1, $2, $3) RETURNING *`,
      [floor_id, name, is_default]
    );
    return result.rows[0];
  }

  static async findLayoutsByFloor(floorId) {
    const result = await db.query(
      `SELECT * FROM floor_layouts WHERE floor_id = $1 ORDER BY created_at DESC`,
      [floorId]
    );
    return result.rows;
  }

  static async updateLayout(id, storeId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && !['id', 'created_at', 'floor_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      const result = await db.query(
        `SELECT fl.* FROM floor_layouts fl
         JOIN floors f ON fl.floor_id = f.id
         WHERE fl.id = $1 AND f.store_id = $2`,
        [id, storeId]
      );
      return result.rows[0] || null;
    }

    values.push(id, storeId);

    const result = await db.query(
      `UPDATE floor_layouts SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
         AND EXISTS (SELECT 1 FROM floors f WHERE f.id = floor_layouts.floor_id AND f.store_id = $${paramIndex + 1})
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async deleteLayout(id, storeId) {
    const result = await db.query(
      `DELETE FROM floor_layouts
       WHERE id = $1
         AND EXISTS (SELECT 1 FROM floors f WHERE f.id = floor_layouts.floor_id AND f.store_id = $2)
       RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async createElement({
    layout_id,
    type,
    pos_x,
    pos_y,
    rotation = 0,
    label,
    capacity,
    color_tag,
    is_active = true,
    metadata = {}
  }) {
    const result = await db.query(
      `INSERT INTO layout_elements (layout_id, type, pos_x, pos_y, rotation, label, capacity, color_tag, is_active, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        layout_id,
        type,
        pos_x,
        pos_y,
        rotation,
        label,
        capacity,
        color_tag,
        is_active,
        JSON.stringify(metadata)
      ]
    );
    return result.rows[0];
  }

  static async findElementsByLayout(layoutId) {
    const result = await db.query(
      `SELECT * FROM layout_elements WHERE layout_id = $1 ORDER BY created_at ASC`,
      [layoutId]
    );
    return result.rows;
  }

  static async updateElement(id, storeId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && !['id', 'created_at', 'layout_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(key === 'metadata' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      const result = await db.query(
        `SELECT le.* FROM layout_elements le
         JOIN floor_layouts fl ON le.layout_id = fl.id
         JOIN floors f ON fl.floor_id = f.id
         WHERE le.id = $1 AND f.store_id = $2`,
        [id, storeId]
      );
      return result.rows[0] || null;
    }

    values.push(id, storeId);

    const result = await db.query(
      `UPDATE layout_elements SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
         AND EXISTS (
           SELECT 1 FROM floor_layouts fl
           JOIN floors f ON fl.floor_id = f.id
           WHERE fl.id = layout_elements.layout_id AND f.store_id = $${paramIndex + 1}
         )
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async deleteElement(id, storeId) {
    const result = await db.query(
      `DELETE FROM layout_elements
       WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM floor_layouts fl
           JOIN floors f ON fl.floor_id = f.id
           WHERE fl.id = layout_elements.layout_id AND f.store_id = $2
         )
       RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async saveLayout(layoutId, storeId, elements) {
    const layoutCheck = await db.query(
      `SELECT fl.id FROM floor_layouts fl
       JOIN floors f ON fl.floor_id = f.id
       WHERE fl.id = $1 AND f.store_id = $2`,
      [layoutId, storeId]
    );
    if (layoutCheck.rows.length === 0) return null;

    const existing = await this.findElementsByLayout(layoutId);
    for (const e of existing) {
      await this.deleteElement(e.id, storeId);
    }

    const created = [];
    for (const el of elements || []) {
      created.push(await this.createElement({ layout_id: layoutId, ...el }));
    }

    return created;
  }

  static async findFullFloor(floorId) {
    const floor = await this.findById(floorId);
    if (!floor) return null;

    const layouts = await this.findLayoutsByFloor(floorId);
    const layoutsWithElements = await Promise.all(
      layouts.map(async (layout) => ({
        ...layout,
        elements: await this.findElementsByLayout(layout.id)
      }))
    );

    return { ...floor, layouts: layoutsWithElements };
  }
}

module.exports = Floor;