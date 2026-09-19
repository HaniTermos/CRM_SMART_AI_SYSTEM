/**
 * SmartStore AI — Real-Time Terminal Health & Route Monitor
 * Displays live page/route entry, health status, latency, and errors in the terminal.
 */

function terminalHealthMonitor(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const url = req.originalUrl || req.url;

    // Filter out noisy polling routes if needed, but display all page / API routes
    let statusIcon = '🟢';
    let statusColor = '\x1b[32m'; // Green
    let healthLabel = 'HEALTHY';

    if (statusCode >= 500) {
      statusIcon = '🔴';
      statusColor = '\x1b[31m'; // Red
      healthLabel = 'SERVER ERROR';
    } else if (statusCode >= 400) {
      statusIcon = '🟡';
      statusColor = '\x1b[33m'; // Yellow
      healthLabel = 'CLIENT ERROR';
    } else if (statusCode >= 300) {
      statusIcon = '🔵';
      statusColor = '\x1b[36m'; // Cyan
      healthLabel = 'REDIRECT';
    }

    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    const dim = '\x1b[2m';
    const methodColor = '\x1b[35m'; // Magenta

    const timestamp = new Date().toLocaleTimeString();

    // Identify if this is a public page resolution or store page
    let contextNote = '';
    if (url.startsWith('/api/public/v3/resolve/')) {
      const parts = url.replace('/api/public/v3/resolve/', '').split('/');
      const storeSlug = parts[0];
      const pageSlug = parts[1] || 'home';
      contextNote = ` ${dim}[V3 Page: ${bold}${storeSlug}/${pageSlug}${dim}]${reset}`;
    } else if (url.startsWith('/shop/')) {
      contextNote = ` ${dim}[Storefront Page: ${bold}${url}${dim}]${reset}`;
    } else if (url.startsWith('/cms-v3')) {
      contextNote = ` ${dim}[Studio Workspace: ${bold}${url}${dim}]${reset}`;
    }

    console.log(
      `${dim}[${timestamp}]${reset} ${statusIcon} ${statusColor}${bold}[HEALTH: ${statusCode} ${healthLabel}]${reset} ${methodColor}${req.method.padEnd(6)}${reset} ${bold}${url}${reset} ${dim}(${duration}ms)${reset}${contextNote}`
    );
  });

  next();
}

module.exports = terminalHealthMonitor;
