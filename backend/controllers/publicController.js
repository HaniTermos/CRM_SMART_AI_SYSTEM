const db = require('../config/database');
const orderService = require('../services/orderService');
const orderLookupService = require('../services/orderLookupService');
const discountService = require('../services/discountService');

exports.getStoreBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await db.query(
      `SELECT id, name, slug, currency, shipping_fee 
       FROM stores 
       WHERE slug = $1`,
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getV3PublicPage = async (req, res, next) => {
  try {
    const { storeSlug, pageSlug } = req.params;
    const storeRes = await db.query(`SELECT id FROM stores WHERE slug = $1`, [storeSlug]);
    if (storeRes.rows.length === 0) {
      return res.json({ success: true, data: { v3Enabled: false, fallback: true } });
    }
    const storeId = storeRes.rows[0].id;

    // Check Site config flag
    const siteRes = await db.query(`SELECT cms_v3_enabled FROM cms_v3_sites WHERE store_id = $1`, [storeId]);
    const v3Enabled = siteRes.rows.length > 0 ? siteRes.rows[0].cms_v3_enabled : false;

    if (!v3Enabled) {
      return res.json({ success: true, data: { v3Enabled: false, fallback: true } });
    }

    // Lookup V3 Page
    const targetSlug = pageSlug || 'home';
    const pageRes = await db.query(`SELECT * FROM cms_v3_pages WHERE store_id = $1 AND slug = $2`, [storeId, targetSlug]);
    if (pageRes.rows.length === 0 || !pageRes.rows[0].published_version_id || !pageRes.rows[0].is_published) {
      return res.json({ success: true, data: { v3Enabled: true, hasPublishedVersion: false, fallback: true } });
    }

    const versionRes = await db.query(
      `SELECT * FROM cms_v3_page_versions WHERE id = $1 AND store_id = $2 AND status = 'published'`,
      [pageRes.rows[0].published_version_id, storeId]
    );

    if (versionRes.rows.length === 0) {
      return res.json({ success: true, data: { v3Enabled: true, hasPublishedVersion: false, fallback: true } });
    }

    res.json({
      success: true,
      data: {
        v3Enabled: true,
        fallback: false,
        publishedDocument: versionRes.rows[0].component_tree,
        page: pageRes.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getStoreProducts = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      `SELECT id, name, slug, price, image_url, description, category_id, stock
       FROM products 
       WHERE store_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getStoreProductBySlug = async (req, res, next) => {
  try {
    const { storeId, slug } = req.params;
    const result = await db.query(
      `SELECT id, name, slug, price, image_url, description, stock
       FROM products 
       WHERE store_id = $1 AND slug = $2 AND status = 'active'`,
      [storeId, slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getStoreCategories = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      `SELECT id, name
       FROM categories 
       WHERE store_id = $1
       ORDER BY name ASC`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await db.query(
      `SELECT id, author_name, rating, comment, verified_purchase, created_at
       FROM product_reviews 
       WHERE product_id = $1 AND status = 'approved'
       ORDER BY created_at DESC`,
      [productId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.placeOrder = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { customer, address, notes, discount_code, items, table_label, floor_id } = req.body;

    const storeRes = await db.query('SELECT id FROM stores WHERE slug = $1', [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });

    const source = table_label || floor_id ? 'dine_in' : (address && Object.keys(address).length > 0 ? 'delivery' : 'takeaway');

    const result = await orderService.createOrder({
      storeId: storeRes.rows[0].id,
      customer,
      address,
      notes,
      discount_code,
      items,
      table_label,
      floor_id,
      source
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.validateDiscount = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { code, subtotal, phone, email } = req.body;

    if (!code) return res.status(400).json({ error: 'Discount code is required' });

    const storeRes = await db.query('SELECT id FROM stores WHERE slug = $1', [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
    const storeId = storeRes.rows[0].id;

    const result = await discountService.validateDiscount({ storeId, code, subtotal, phone, email });

    res.json({ success: true, data: { code: result.code, amount: result.amount } });
  } catch (error) {
    next(error);
  }
};

exports.lookupOrder = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { orderNumber, phone } = req.body;

    const storeRes = await db.query('SELECT id FROM stores WHERE slug = $1', [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });

    const result = await orderLookupService.lookupOrder({
      storeId: storeRes.rows[0].id,
      orderNumber,
      phone
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.lookupDeals = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { phone, email } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const storeRes = await db.query(
      'SELECT id, name, currency FROM stores WHERE slug = $1',
      [slug]
    );
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const store = storeRes.rows[0];

    const customerQuery = [
      'SELECT id, name, email, phone FROM customers WHERE store_id = $1 AND phone = $2',
    ];
    const params = [store.id, phone];

    if (email) {
      customerQuery[0] += ' AND email = $3';
      params.push(email);
    }

    const customerRes = await db.query(customerQuery[0], params);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found with that phone number' });
    }
    const customer = customerRes.rows[0];

    const dealsRes = await db.query(
      `SELECT d.id, d.title, d.value, d.status, d.expected_close_date, d.created_at,
              d.redemption_code, d.redeemed_at,
              p.name as pipeline_name, s.name as stage_name
       FROM crm_deals d
       JOIN crm_pipelines p ON d.pipeline_id = p.id
       JOIN crm_stages s ON d.stage_id = s.id
       WHERE d.store_id = $1 AND d.customer_id = $2
       ORDER BY d.created_at DESC`,
      [store.id, customer.id]
    );

    res.json({
      success: true,
      data: {
        store: { id: store.id, name: store.name, currency: store.currency },
        customer,
        deals: dealsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.redeemDeal = async (req, res, next) => {
  try {
    const { slug, dealId } = req.params;
    const { phone, email } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const storeRes = await db.query(
      'SELECT id, name, currency FROM stores WHERE slug = $1',
      [slug]
    );
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const store = storeRes.rows[0];

    const customerQuery = ['SELECT id, name, email, phone FROM customers WHERE store_id = $1 AND phone = $2'];
    const params = [store.id, phone];
    if (email) {
      customerQuery[0] += ' AND email = $3';
      params.push(email);
    }

    const customerRes = await db.query(customerQuery[0], params);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found with that phone number' });
    }
    const customer = customerRes.rows[0];

    const dealRes = await db.query(
      `SELECT d.*, c.id as customer_id, c.name as customer_name
       FROM crm_deals d
       JOIN customers c ON d.customer_id = c.id
       WHERE d.id = $1 AND d.store_id = $2`,
      [dealId, store.id]
    );

    if (dealRes.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const deal = dealRes.rows[0];
    if (deal.customer_id !== customer.id) {
      return res.status(404).json({ error: 'This deal is not linked to the provided customer contact.' });
    }

    const redemptionCode = deal.redemption_code || `DEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const redemptionNotes = deal.redemption_notes
      ? `${deal.redemption_notes}\nRedeemed via customer portal.`
      : 'Redeemed via customer portal.';

    const updatedDealRes = await db.query(
      `UPDATE crm_deals
       SET redemption_code = $1,
           redeemed_at = COALESCE(redeemed_at, NOW()),
           status = $2,
           redemption_notes = $3,
           updated_at = NOW()
       WHERE id = $4 AND store_id = $5
       RETURNING id, title, value, status, expected_close_date, created_at, redemption_code, redeemed_at, redemption_notes, pipeline_id, stage_id, customer_id`,
      [redemptionCode, 'won', redemptionNotes, dealId, store.id]
    );

    const updatedDeal = updatedDealRes.rows[0];
    const pipelineStageRes = await db.query(
      `SELECT p.name as pipeline_name, s.name as stage_name
       FROM crm_pipelines p
       JOIN crm_stages s ON s.pipeline_id = p.id
       WHERE p.id = $1 AND s.id = $2`,
      [updatedDeal.pipeline_id, updatedDeal.stage_id]
    );

    const pipelineStage = pipelineStageRes.rows[0] || { pipeline_name: null, stage_name: null };

    res.json({
      success: true,
      data: {
        customer,
        deal: {
          ...updatedDeal,
          pipeline_name: pipelineStage.pipeline_name,
          stage_name: pipelineStage.stage_name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.handleQrScan = async (req, res, next) => {
  try {
    const { qrId } = req.params;
    const QrCode = require('../models/QrCode');
    const qr = await QrCode.findById(qrId);
    if (!qr) {
      return res.status(404).send('QR Code not found');
    }
    await QrCode.incrementScanCount(qrId);
    return res.redirect(302, qr.target_url);
  } catch (error) {
    next(error);
  }
};

exports.getPublicStorefrontSnapshot = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const storeRes = await db.query(`SELECT id, name, slug, currency FROM stores WHERE slug = $1`, [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
    const store = storeRes.rows[0];

    const CmsSettings = require('../models/CmsSettings');
    const CmsTheme = require('../models/CmsTheme');
    const CmsAnnouncement = require('../models/CmsAnnouncement');
    const CmsNavigation = require('../models/CmsNavigation');

    const appearance = await CmsSettings.findByStoreId(store.id);
    const activeTheme = appearance.theme_id ? await CmsTheme.findById(appearance.theme_id) : null;
    const activeAnnouncement = await CmsAnnouncement.findActivePublishedByStoreId(store.id);
    const headerNav = await CmsNavigation.findByStoreId(store.id, 'header');
    const footerNav = await CmsNavigation.findByStoreId(store.id, 'footer');

    res.json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          currency: store.currency
        },
        appearance: {
          logo_url: appearance.logo_url,
          favicon_url: appearance.favicon_url,
          primary_color: appearance.primary_color || '#190E85',
          accent_color: appearance.accent_color || '#00E0FF',
          font_family: appearance.font_family || 'Inter',
          button_style: appearance.button_style || 'rounded',
          border_radius: appearance.border_radius || '0.75rem',
          theme_mode: appearance.theme_mode || 'light',
          seo_title: appearance.seo_title,
          seo_description: appearance.seo_description,
          theme_id: appearance.theme_id,
          theme: activeTheme
        },
        announcement: activeAnnouncement,
        navigation: {
          header: headerNav,
          footer: footerNav
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPublicPageV2 = async (req, res, next) => {
  try {
    const { slug, pageSlug } = req.params;
    const storeRes = await db.query(`SELECT id FROM stores WHERE slug = $1`, [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
    const storeId = storeRes.rows[0].id;

    const CmsPageV2 = require('../models/CmsPageV2');
    const CmsPageSection = require('../models/CmsPageSection');
    const CmsPreviewToken = require('../models/CmsPreviewToken');

    const targetSlug = pageSlug || 'home';
    const page = await CmsPageV2.findBySlug(storeId, targetSlug);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    // Validate preview token if provided
    let isAuthorizedPreview = false;
    if (req.query.preview_token) {
      isAuthorizedPreview = await CmsPreviewToken.validateToken(req.query.preview_token, storeId);
    }

    // Un-authenticated visitors only see published pages
    if (!isAuthorizedPreview && page.status !== 'published') {
      return res.status(404).json({ error: 'Page not found or not published' });
    }

    const sections = await CmsPageSection.findByPageId(page.id, storeId);
    const visibleSections = isAuthorizedPreview ? sections : sections.filter(s => s.is_visible);

    res.json({
      success: true,
      data: {
        page: {
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: page.type,
          status: page.status,
          is_preview: isAuthorizedPreview,
          seo_title: page.seo_title,
          seo_description: page.seo_description,
          social_image_url: page.social_image_url
        },
        sections: visibleSections
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.submitPublicContactMessage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const storeRes = await db.query(`SELECT id FROM stores WHERE slug = $1`, [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });

    const CmsContactMessage = require('../models/CmsContactMessage');
    const created = await CmsContactMessage.create({
      ...req.body,
      store_id: storeRes.rows[0].id
    });

    res.status(201).json({ success: true, data: created, message: 'Message sent successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};


