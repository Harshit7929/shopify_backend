// routes/shopifyRoutes.js
const express = require('express');
const router = express.Router();

const {
  fetchCustomers,
  fetchOrders,
  fetchProducts,
  syncAll
} = require('../controllers/shopifyController');

const Tenant = require('../models/Tenant');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// ----------------------
// Individual sync endpoints (tenantId REQUIRED)
// ----------------------

// Sync Customers for a single tenant
router.get('/sync-customers/:tenantId', fetchCustomers);

// Sync Orders for a single tenant
router.get('/sync-orders/:tenantId', fetchOrders);

// Sync Products for a single tenant
router.get('/sync-products/:tenantId', fetchProducts);

// ----------------------
// Sync-all endpoint (tenantId OPTIONAL via query param)
// ----------------------
router.get('/sync-all', syncAll);
router.get('/sync-all/:tenantId', syncAll);

// ----------------------
// Dashboard & Insights endpoints
// ----------------------

// Get total metrics (customers, orders, revenue) for tenant
router.get('/metrics/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const totalCustomers = await Customer.count({ where: { tenant_id: tenant.id } });
    const totalOrders = await Order.count({ where: { tenant_id: tenant.id } });
    const totalRevenue = await Order.sum('total', { where: { tenant_id: tenant.id } }) || 0;

    res.json({ customers: totalCustomers, orders: totalOrders, revenue: totalRevenue });
  } catch (err) {
    console.error('Error fetching metrics:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get orders grouped by date
router.get('/orders-by-date/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const orders = await Order.findAll({
      where: { tenant_id: tenant.id },
      attributes: ['created_at'],
      order: [['created_at', 'ASC']]
    });

    const grouped = {};
    orders.forEach(o => {
      const date = o.created_at.toISOString().split('T')[0]; // YYYY-MM-DD
      grouped[date] = (grouped[date] || 0) + 1;
    });

    const result = Object.keys(grouped).map(date => ({ date, orders: grouped[date] }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching orders by date:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch orders by date' });
  }
});

// Get top 5 customers by total spend
router.get('/top-customers/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const topCustomers = await Customer.findAll({
      where: { tenant_id: tenant.id },
      order: [['total_spent', 'DESC']],
      limit: 5
    });

    res.json(topCustomers);
  } catch (err) {
    console.error('Error fetching top customers:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
});

module.exports = router;
