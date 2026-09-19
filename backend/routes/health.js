const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/health — System & Database Health Check
router.get('/', async (req, res) => {
  try {
    const dbStart = Date.now();
    await db.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    const healthData = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        latency_ms: dbLatency,
      },
    };

    console.log(`💚 [HEALTH CHECK OK] DB: connected (${dbLatency}ms latency) | Uptime: ${Math.floor(process.uptime())}s`);
    res.json(healthData);
  } catch (err) {
    console.error(`❌ [HEALTH CHECK UNHEALTHY] DB Error: ${err.message}`);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: err.message,
      },
    });
  }
});

// POST /api/health/client-nav — Receives Frontend Client Page Enter & Health Events
router.post('/client-nav', (req, res) => {
  const { path, pageTitle, loadTimeMs, status, error, userAgent } = req.body || {};
  const timestamp = new Date().toLocaleTimeString();
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const dim = '\x1b[2m';

  if (status === 'error' || error) {
    const red = '\x1b[31m';
    console.error(
      `${dim}[${timestamp}]${reset} 🔴 ${red}${bold}[FRONTEND PAGE ERROR]${reset} ${bold}${path || '/'}${reset} — ${red}${error || 'Unknown rendering error'}${reset} ${dim}(Title: "${pageTitle || 'Untitled'}")${reset}`
    );
  } else {
    const green = '\x1b[32m';
    const blue = '\x1b[34m';
    console.log(
      `${dim}[${timestamp}]${reset} 📱 ${green}${bold}[FRONTEND PAGE ENTERED]${reset} ${blue}${bold}${path || '/'}${reset} ${dim}|${reset} Title: "${bold}${pageTitle || 'SmartStore AI'}${reset}" ${dim}| Load: ${loadTimeMs || 0}ms | Status: 🟢 HEALTHY${reset}`
    );
  }

  res.json({ success: true, received: true });
});

module.exports = router;
