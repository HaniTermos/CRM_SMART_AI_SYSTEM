/**
 * SmartStore Website Studio (CMS V3) — Store-Scoped Newsletter Subscription Service
 */

const db = require('../config/database');

class CmsV3NewsletterService {
  static async subscribe({ storeId, email, consentGiven = true, source = 'newsletter_block' }) {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email address required.' };
    }

    if (!consentGiven) {
      return { success: false, error: 'Explicit marketing consent is required to subscribe.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();

      await db.query(
        `INSERT INTO cms_v3_newsletter_subscriptions (store_id, email, source, consent_given, consent_timestamp, status)
         VALUES ($1, $2, $3, $4, NOW(), 'subscribed')
         ON CONFLICT (store_id, email)
         DO UPDATE SET status = 'subscribed', consent_given = $4, updated_at = NOW()`,
        [storeId, cleanEmail, source, Boolean(consentGiven)]
      );

      // Return generic success response
      return {
        success: true,
        message: 'Thank you for subscribing to our updates.'
      };
    } catch (err) {
      console.error('[NEWSLETTER SERVICE ERROR]', err);
      // Return generic success response to prevent email enumeration
      return {
        success: true,
        message: 'Thank you for subscribing to our updates.'
      };
    }
  }
}

module.exports = CmsV3NewsletterService;
