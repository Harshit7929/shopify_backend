// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getMetrics, getOrdersByDate, getTopCustomers } = require('../controllers/dashboardController');
const { authenticate } = require('./authRoutes'); // ✅ works, since authRoutes exports { router, authenticate }

// Protected routes
router.get('/metrics/:tenantId', authenticate, getMetrics);
router.get('/orders-by-date/:tenantId', authenticate, getOrdersByDate);
router.get('/top-customers/:tenantId', authenticate, getTopCustomers);

module.exports = router;
