const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/stores/:slug', publicController.getStoreBySlug);

router.get('/v3/resolve/:storeSlug', publicController.getV3PublicPage);
router.get('/v3/resolve/:storeSlug/:pageSlug', publicController.getV3PublicPage);

router.get(
    '/stores/:storeId/products',
    publicController.getStoreProducts
);

router.get(
    '/stores/:storeId/products/:slug',
    publicController.getStoreProductBySlug
);

router.get(
    '/stores/:storeId/categories',
    publicController.getStoreCategories
);

router.post(
    '/stores/:slug/discounts/validate',
    publicController.validateDiscount
);

router.post(
    '/stores/:slug/checkout',
    publicController.placeOrder
);

router.post(
    '/stores/:slug/deals/lookup',
    publicController.lookupDeals
);

router.post(
    '/stores/:slug/deals/:dealId/redeem',
    publicController.redeemDeal
);

router.post(
    '/stores/:slug/orders/lookup',
    publicController.lookupOrder
);

router.get(
    '/products/:productId/reviews',
    publicController.getProductReviews
);

router.get(
    '/qr/r/:qrId',
    publicController.handleQrScan
);

// CMS V2 storefront snapshot
router.get(
    '/stores/:slug/cms/v2/snapshot',
    publicController.getPublicStorefrontSnapshot
);

// CMS V2 homepage (serves the 'home' page slug)
router.get(
    '/stores/:slug/cms/v2/pages',
    publicController.getPublicPageV2
);

// CMS V2 static/custom page
router.get(
    '/stores/:slug/cms/v2/pages/:pageSlug',
    publicController.getPublicPageV2
);

// Public contact form
router.post(
    '/stores/:slug/cms/v2/contact',
    publicController.submitPublicContactMessage
);

module.exports = router;