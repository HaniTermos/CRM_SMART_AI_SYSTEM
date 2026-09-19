const db = require('../config/database');

class CmsSectionVariant {
  static async findAll() {
    const res = await db.query(`SELECT * FROM cms_section_variants ORDER BY section_type, variant_name`);
    return res.rows;
  }

  static async findByType(section_type) {
    const res = await db.query(`SELECT * FROM cms_section_variants WHERE section_type = $1 ORDER BY variant_name`, [section_type]);
    return res.rows;
  }

  static async findSpecific(section_type, variant_name) {
    const res = await db.query(`SELECT * FROM cms_section_variants WHERE section_type = $1 AND variant_name = $2`, [section_type, variant_name]);
    return res.rows[0] || null;
  }
}

module.exports = CmsSectionVariant;
