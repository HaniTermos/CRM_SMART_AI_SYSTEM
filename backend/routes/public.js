const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/stores/:slug', publicController.getStoreBySlug);
router.get('/stores/:storeId/products', publicController.getStoreProducts);
router.get('/stores/:storeId/products/:slug', publicController.getStoreProductBySlug);
router.get('/stores/:storeId/categories', publicController.getStoreCategories);
router.post('/stores/:slug/discounts/validate', publicController.validateDiscount);
router.post('/stores/:slug/checkout', publicController.placeOrder);
router.post('/stores/:slug/deals/lookup', publicController.lookupDeals);
router.post('/stores/:slug/deals/:dealId/redeem', publicController.redeemDeal);
router.post('/stores/:slug/orders/lookup', publicController.lookupOrder);
router.get('/products/:productId/reviews', publicController.getProductReviews);

module.exports = router;
