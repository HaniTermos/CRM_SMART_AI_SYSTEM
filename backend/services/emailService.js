const nodemailer = require('nodemailer');

const SMTP_URL = process.env.SMTP_URL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@smartstore.ai';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'SmartStore AI';

function isEnabled() {
  return Boolean(SMTP_URL || (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS));
}

function getTransport() {
  if (SMTP_URL) {
    return nodemailer.createTransport(SMTP_URL);
  }

  if (!isEnabled()) {
    throw new Error('SMTP transport is not configured');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function getDefaultFrom() {
  if (EMAIL_FROM_NAME) {
    return `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`;
  }
  return EMAIL_FROM;
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function sendMail({ to, subject, html, text }) {
  const transport = getTransport();
  const message = {
    from: getDefaultFrom(),
    to,
    subject,
    html,
    text: text || stripHtml(html),
  };

  return transport.sendMail(message);
}

module.exports = {
  isEnabled,
  sendMail,
};
