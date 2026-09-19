const path = require('path');
const fs = require('fs');
const QRCodeLib = require('qrcode');
const QrCode = require('../models/QrCode');

exports.generateQr = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { type, label, target_url, metadata = {} } = req.body;

    if (!type || !target_url) {
      return res.status(400).json({ error: 'type and target_url are required' });
    }

    const qrDir = path.join(__dirname, '..', 'uploads', 'qr', storeId);
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const filename = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
    const imagePathOnDisk = path.join(qrDir, filename);

    // Create record first to get qr ID for redirect link if needed
    const tempRecord = await QrCode.create({
      store_id: storeId,
      type,
      label: label || `${type.toUpperCase()} QR`,
      target_url,
      image_path: `/uploads/qr/${storeId}/${filename}`,
      metadata
    });

    // Public scan tracker URL
    const baseUrl = req.store?.settings?.publicUrl || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const scanRedirectUrl = `${baseUrl}/api/public/qr/r/${tempRecord.id}`;

    // Generate PNG to disk encoding scanRedirectUrl
    await QRCodeLib.toFile(imagePathOnDisk, scanRedirectUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#190E85',
        light: '#FFFFFF'
      }
    });

    res.status(201).json({ success: true, data: tempRecord });
  } catch (error) {
    next(error);
  }
};

exports.getQrCodes = async (req, res, next) => {
  try {
    const qrCodes = await QrCode.findByStore(req.store.id);
    res.json({ success: true, data: qrCodes });
  } catch (error) {
    next(error);
  }
};

exports.getQrCodeById = async (req, res, next) => {
  try {
    const qrCode = await QrCode.findById(req.params.id);
    if (!qrCode || qrCode.store_id !== req.params.storeId) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    res.json({ success: true, data: qrCode });
  } catch (error) {
    next(error);
  }
};

exports.deleteQrCode = async (req, res, next) => {
  try {
    const deleted = await QrCode.delete(req.params.id, req.params.storeId);
    if (!deleted) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
