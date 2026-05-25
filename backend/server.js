const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'change-this-secret'));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));
app.use('/api/health', require('./routes/health'));

app.use('/api/auth',require('./routes/auth'));
app.use('/api/public',require('./routes/public'));
app.use('/api/stores',require('./routes/stores'));
app.use('/api/products/:storeId',require('./routes/products'));
app.use('/api/categories/:storeId',require('./routes/categories'));
app.use('/api/customers/:storeId',require('./routes/customers'));
app.use('/api/crm/:storeId',require('./routes/crm'));
app.use('/api/campaigns/:storeId',require('./routes/campaigns'));
app.use('/api/orders/:storeId',require('./routes/orders'));
app.use('/api/reports/:storeId',require('./routes/reports'));
app.use('/api/ai/:storeId',require('./routes/ai'));
app.use('/api/discounts/:storeId',require('./routes/discounts'));
app.use('/api/reviews/:storeId',require('./routes/reviews'));
app.use('/api/inventory/:storeId',require('./routes/inventory'));
app.use('/api/team/:storeId',require('./routes/team'));

const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
  console.log(`Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)}`);
});

module.exports = app;
