const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { Op } = require('sequelize');

// Get total customers, orders, and revenue
async function getMetrics(req, res) {
  const tenantId = req.params.tenantId;

  try {
    const totalCustomers = await Customer.count({ where: { tenant_id: tenantId } });
    const totalOrders = await Order.count({ where: { tenant_id: tenantId } });
    const orders = await Order.findAll({ where: { tenant_id: tenantId }, attributes: ['total'] });
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    res.json({ customers: totalCustomers, orders: totalOrders, revenue: totalRevenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

// Get orders grouped by date with optional date range
async function getOrdersByDate(req, res) {
  const tenantId = req.params.tenantId;
  const { startDate, endDate } = req.query;

  try {
    const where = { tenant_id: tenantId };
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const orders = await Order.findAll({ where, attributes: ['created_at'] });
    const grouped = {};

    orders.forEach(o => {
      const date = new Date(o.created_at).toISOString().slice(0, 10);
      grouped[date] = (grouped[date] || 0) + 1;
    });

    const result = Object.entries(grouped).map(([date, orders]) => ({ date, orders }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders by date' });
  }
}

// Get top 5 customers by spend
async function getTopCustomers(req, res) {
  const tenantId = req.params.tenantId;

  try {
    const customers = await Customer.findAll({
      where: { tenant_id: tenantId },
      order: [['total_spent', 'DESC']],
      limit: 5
    });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
}

module.exports = { getMetrics, getOrdersByDate, getTopCustomers };
