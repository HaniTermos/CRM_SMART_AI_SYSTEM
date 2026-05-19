const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Store details by slug
router.get('/stores/:slug', publicController.getStoreBySlug);

// Store products
router.get('/stores/:storeId/products', publicController.getStoreProducts);

// Store single product
router.get('/stores/:storeId/products/:slug', publicController.getStoreProductBySlug);

// Store categories
router.get('/stores/:storeId/categories', publicController.getStoreCategories);

// Validate discount code
router.post('/stores/:slug/discounts/validate', publicController.validateDiscount);

// Place order (checkout)
router.post('/stores/:slug/checkout', publicController.placeOrder);

// Order lookup
router.post('/stores/:slug/orders/lookup', publicController.lookupOrder);

// Product reviews
router.get('/products/:productId/reviews', publicController.getProductReviews);

module.exports = router;
