const db = require('../config/database');
const emailService = require('../services/emailService');

exports.getSmtpStatus = async (req, res, next) => {
  try {
    const enabled = emailService.isEnabled();
    res.json({
      success: true,
      data: {
        enabled,
        host: process.env.SMTP_HOST || null,
        port: process.env.SMTP_PORT || null,
        user: process.env.SMTP_USER || null,
        from: process.env.EMAIL_FROM || null,
        message: enabled
          ? 'SMTP is configured. Emails will be sent to real recipients.'
          : 'SMTP is not configured. Campaigns will run in simulation mode only.',
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.testSmtp = async (req, res, next) => {
  try {
    if (!emailService.isEnabled()) {
      return res.status(400).json({ error: 'SMTP is not configured.' });
    }

    const { to } = req.body;
    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: 'A valid recipient email is required.' });
    }

    await emailService.sendMail({
      to,
      subject: 'SmartStore AI — SMTP Test',
      html: '<p>This is a test email from your SmartStore AI system.</p><p>If you received this, your SMTP configuration is working correctly.</p>',
      text: 'This is a test email from your SmartStore AI system. If you received this, your SMTP configuration is working correctly.',
    });

    res.json({ success: true, message: `Test email sent to ${to}. Check your inbox.` });
  } catch (error) {
    console.error('[SMTP Test] Failed:', error);
    res.status(500).json({ error: error.message || 'Failed to send test email.' });
  }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      'SELECT * FROM email_campaigns WHERE store_id = $1 ORDER BY created_at DESC',
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.createCampaign = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { name, subject, content_html, target_segment } = req.body;
    
    const result = await db.query(
      `INSERT INTO email_campaigns (store_id, name, subject, content_html, target_segment) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [storeId, name, subject || 'New Campaign', content_html || '<p></p>', target_segment || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateCampaign = async (req, res, next) => {
  try {
    const { storeId, campaignId } = req.params;
    const { name, subject, content_html, target_segment, status } = req.body;
    
    const result = await db.query(
      `UPDATE email_campaigns 
       SET name = COALESCE($1, name), subject = COALESCE($2, subject), 
           content_html = COALESCE($3, content_html), target_segment = COALESCE($4, target_segment),
           status = COALESCE($5, status), updated_at = NOW() 
       WHERE id = $6 AND store_id = $7 RETURNING *`,
      [name, subject, content_html, target_segment, status, campaignId, storeId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.sendCampaign = async (req, res, next) => {
  try {
    const { storeId, campaignId } = req.params;
    
    const campaign = await db.query(
      `UPDATE email_campaigns SET status = 'sending' WHERE id = $1 AND store_id = $2 RETURNING *`,
      [campaignId, storeId]
    );
    
    if (campaign.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    
    let customerQuery = "SELECT id, name, email FROM customers WHERE store_id = $1 AND email IS NOT NULL AND email <> ''";
    const params = [storeId];
    if (campaign.rows[0].target_segment) {
      customerQuery += ' AND segment = $2';
      params.push(campaign.rows[0].target_segment);
    }

    const customersRes = await db.query(customerQuery, params);
    const customers = customersRes.rows;
    const audienceCount = customers.length;

    if (emailService.isEnabled()) {
      const sendResults = await Promise.allSettled(
        customers.map((customer) =>
          emailService.sendMail({
            to: customer.email,
            subject: campaign.rows[0].subject,
            html: campaign.rows[0].content_html,
            text: `Hello ${customer.name || 'Customer'},\n\n${campaign.rows[0].subject}`,
          })
        )
      );

      const successCount = sendResults.filter((result) => result.status === 'fulfilled').length;
      const failedCount = sendResults.filter((result) => result.status === 'rejected').length;
      const status = successCount > 0 ? 'sent' : 'cancelled';

      const result = await db.query(
        `UPDATE email_campaigns SET status = $1, sent_count = $2, updated_at = NOW() WHERE id = $3 AND store_id = $4 RETURNING *`,
        [status, successCount, campaignId, storeId]
      );

      return res.json({
        success: true,
        data: result.rows[0],
        message: `Delivered ${successCount} emails to ${audienceCount} customers. ${failedCount} failed.`,
      });
    }

    const result = await db.query(
      `UPDATE email_campaigns SET status = 'sent', sent_count = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3 RETURNING *`,
      [audienceCount, campaignId, storeId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: `SMTP not configured. Campaign marked as sent to ${audienceCount} customers in simulation mode.`,
    });
  } catch (error) {
    next(error);
  }
};