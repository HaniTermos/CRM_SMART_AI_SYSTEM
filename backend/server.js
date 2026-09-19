const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'change-this-secret'));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || (process.env.NODE_ENV || 'development') !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

const terminalHealthMonitor = require('./middlewares/terminalHealthMonitor');
const { securityHeaders, rateLimit } = require('./middlewares/security');
app.use(securityHeaders);
app.use(rateLimit);
app.use(terminalHealthMonitor);

const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));
app.use('/api/health', require('./routes/health'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
app.use('/api/users/me/preferences', require('./routes/userPreferences'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/products/:storeId', require('./routes/products'));
app.use('/api/categories/:storeId', require('./routes/categories'));
app.use('/api/customers/:storeId', require('./routes/customers'));
app.use('/api/crm/:storeId', require('./routes/crm'));
app.use('/api/campaigns/:storeId', require('./routes/campaigns'));
app.use('/api/orders/:storeId', require('./routes/orders'));
app.use('/api/discounts/:storeId', require('./routes/discounts'));
app.use('/api/reviews/:storeSlug', require('./routes/reviews'));
app.use('/api/inventory/:storeId', require('./routes/inventory'));
app.use('/api/team/:storeId', require('./routes/team'));
app.use('/api/floors/:storeId', require('./routes/floors'));
app.use('/api/reservations/:storeId', require('./routes/reservations'));
app.use('/api/kitchen/:storeId', require('./routes/kitchen'));
app.use('/api/qr/:storeId', require('./routes/qr'));
app.use('/api/stores/me/growth', require('./routes/growth'));
app.use('/api/stores/:storeId/growth', require('./routes/growth'));
app.use('/api/stores/me/cms/themes', require('./routes/cmsThemes'));
app.use('/api/stores/:storeId/cms/themes', require('./routes/cmsThemes'));
app.use('/api/stores/me/cms', require('./routes/cms'));
app.use('/api/stores/:storeId/cms', require('./routes/cms'));
app.use('/api/stores/me/ai', require('./routes/ai'));
app.use('/api/stores/:storeId/ai', require('./routes/ai'));
app.use('/api/ai/:storeId', require('./routes/ai'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/stores/me/reports', require('./routes/reports'));
app.use('/api/stores/:storeId/reports', require('./routes/reports'));
app.use('/api/reports/:storeId', require('./routes/reports'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/stores/me/dashboard', require('./routes/dashboard'));
app.use('/api/stores/:storeId/dashboard', require('./routes/dashboard'));
app.use('/api/cms-v3/me', require('./routes/cmsV3'));
app.use('/api/cms-v3/:storeId', require('./routes/cmsV3'));

const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
  console.log(`Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)}`);
});

server.on('error', (err) => {
  console.error(`Server failed to start on port ${PORT}:`, err.message);
});

module.exports = app;
