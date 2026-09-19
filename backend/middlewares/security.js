/**
 * Lightweight security headers and basic API rate limiting (no external deps).
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 120;
const buckets = new Map();

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');
  next();
}

function rateLimit(req, res, next) {
  if (!req.path.startsWith('/api/')) return next();

  const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${req.path.split('/').slice(0, 4).join('/')}`;
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.start > WINDOW_MS) {
    bucket = { start: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  }

  next();
}

module.exports = { securityHeaders, rateLimit };
