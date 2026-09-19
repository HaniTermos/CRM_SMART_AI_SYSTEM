const db = require('../config/database');

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

async function validateDiscount({ storeId, code, subtotal, phone, email }) {
  if (!code) {
    throw badRequest('Discount code is required');
  }

  const normalizedCode = code.toUpperCase();

  // 1. Try active discount code
  const discRes = await db.query(
    "SELECT id, type, value, min_subtotal, expires_at, max_uses, used_count FROM discount_codes WHERE store_id = $1 AND code = $2 AND active = true",
    [storeId, normalizedCode]
  );

  if (discRes.rows.length > 0) {
    const disc = discRes.rows[0];
    if (disc.expires_at && new Date(disc.expires_at) < new Date()) {
      throw badRequest('Discount code has expired');
    }
    if (disc.max_uses && disc.used_count >= disc.max_uses) {
      throw badRequest('Discount code usage limit reached');
    }
    if (disc.min_subtotal && subtotal < Number(disc.min_subtotal)) {
      throw badRequest(`Minimum order amount of ${disc.min_subtotal} required`);
    }

    let amount = 0;
    if (disc.type === 'percent') {
      amount = subtotal * (Number(disc.value) / 100);
    } else {
      amount = Number(disc.value);
    }

    return {
      source: 'discount_code',
      code: normalizedCode,
      type: disc.type,
      value: Number(disc.value),
      min_subtotal: disc.min_subtotal,
      amount
    };
  }

  // 2. Try redeemed CRM deal
  const dealRes = await db.query(
    `SELECT d.value, c.phone AS customer_phone, c.email AS customer_email
     FROM crm_deals d
     JOIN customers c ON c.id = d.customer_id
     WHERE d.store_id = $1 AND d.redemption_code = $2 AND d.redeemed_at IS NOT NULL`,
    [storeId, normalizedCode]
  );

  if (dealRes.rows.length === 0) {
    throw badRequest('Invalid or inactive discount code');
  }

  const deal = dealRes.rows[0];

  if (!phone) {
    throw badRequest('Enter your phone number to validate this deal redemption code');
  }
  if (deal.customer_phone !== phone.trim()) {
    throw badRequest('This deal code does not match your phone number');
  }
  if (email && deal.customer_email && deal.customer_email !== email.trim()) {
    throw badRequest('This deal code does not match your email address');
  }

  return {
    source: 'crm_deal',
    code: normalizedCode,
    amount: Number(deal.value),
    customer_phone: deal.customer_phone,
    customer_email: deal.customer_email
  };
}

module.exports = { validateDiscount };
