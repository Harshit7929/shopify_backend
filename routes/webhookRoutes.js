const express = require('express');
const router = express.Router();
const { handleShopifyWebhook } = require('../controllers/webhookController');

// Shopify webhook endpoint
router.post('/shopify', express.json(), handleShopifyWebhook);

module.exports = router;
