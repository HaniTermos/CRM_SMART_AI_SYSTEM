const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────── MIDDLEWARE ────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'change-this-secret'));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Serve uploaded files as static assets
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ──────────── ROUTES ────────────

// Health check (no auth required)
app.use('/api/health', require('./routes/health'));

// Mounted routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/public',     require('./routes/public'));
app.use('/api/stores',     require('./routes/stores'));
app.use('/api/products/:storeId', require('./routes/products'));
app.use('/api/categories/:storeId', require('./routes/categories'));
app.use('/api/customers/:storeId',  require('./routes/customers'));
app.use('/api/orders/:storeId',     require('./routes/orders'));
app.use('/api/reports/:storeId',    require('./routes/reports'));
app.use('/api/ai/:storeId',         require('./routes/ai'));
app.use('/api/discounts/:storeId',  require('./routes/discounts'));
app.use('/api/reviews/:storeId',    require('./routes/reviews'));
app.use('/api/inventory/:storeId',  require('./routes/inventory'));
app.use('/api/team/:storeId',       require('./routes/team'));

// ──────────── ERROR HANDLER ────────────

const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// ──────────── START SERVER ────────────

app.listen(PORT, () => {
  console.log(`\n  ┌──────────────────────────────────────────┐`);
  console.log(`  │  SmartStore AI Backend                    │`);
  console.log(`  │  Running on http://localhost:${PORT}        │`);
  console.log(`  │  Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)}│`);
  console.log(`  └──────────────────────────────────────────┘\n`);
});

module.exports = app;
