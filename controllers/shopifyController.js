// controllers/shopifyController.js
const axios = require('axios');
require('dotenv').config();

const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Tenant = require('../models/Tenant');

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-07';

// ----------------------
// Helper: find tenant by ID or shop domain
// ----------------------
async function findTenantByIdentifier(identifier) {
  console.log('Looking for tenant with identifier:', identifier); // debug

  if (!identifier) return null;

  // If identifier is numeric → search by ID
  if (/^\d+$/.test(String(identifier))) {
    const tenant = await Tenant.findByPk(Number(identifier));
    console.log('Tenant by ID:', tenant ? tenant.toJSON() : null); // debug
    return tenant || null;
  }

  // Otherwise search by shop_domain (normalize: trim + lowercase)
  const tenant = await Tenant.findOne({
    where: { shop_domain: String(identifier).trim().toLowerCase() }
  });
  console.log('Tenant by shop_domain:', tenant ? tenant.toJSON() : null); // debug
  return tenant || null;
}

// ----------------------
// Sync helpers for a single tenant
// ----------------------
async function syncCustomersForTenant(tenant) {
  if (!tenant?.shop_domain || !tenant?.access_token)
    throw new Error('Tenant not configured with shop domain/access token');

  const url = `https://${tenant.shop_domain}/admin/api/${SHOPIFY_API_VERSION}/customers.json?limit=250`;
  const res = await axios.get(url, {
    headers: { 'X-Shopify-Access-Token': tenant.access_token }
  });
  const customersData = res.data.customers || [];

  const customers = customersData.map(c => ({
    shopify_id: String(c.id),
    email: c.email || null,
    first_name: c.first_name || null,
    last_name: c.last_name || null,
    tenant_id: tenant.id,
    total_spent: parseFloat(c.total_spent || 0),
    created_at: c.created_at ? new Date(c.created_at) : new Date()
  }));

  if (customers.length) {
    await Customer.bulkCreate(customers, {
      updateOnDuplicate: ['email', 'first_name', 'last_name', 'total_spent']
    });
  }

  return customers.length;
}

async function syncProductsForTenant(tenant) {
  if (!tenant?.shop_domain || !tenant?.access_token)
    throw new Error('Tenant not configured with shop domain/access token');

  const url = `https://${tenant.shop_domain}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`;
  const res = await axios.get(url, {
    headers: { 'X-Shopify-Access-Token': tenant.access_token }
  });
  const productsData = res.data.products || [];

  const products = productsData.map(p => ({
    shopify_id: String(p.id),
    title: p.title || '',
    price: parseFloat(p.variants?.[0]?.price || 0),
    tenant_id: tenant.id,
    created_at: p.created_at ? new Date(p.created_at) : new Date()
  }));

  if (products.length) {
    await Product.bulkCreate(products, {
      updateOnDuplicate: ['title', 'price']
    });
  }

  return products.length;
}

async function syncOrdersForTenant(tenant) {
  if (!tenant?.shop_domain || !tenant?.access_token)
    throw new Error('Tenant not configured with shop domain/access token');

  const url = `https://${tenant.shop_domain}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&limit=250`;
  const res = await axios.get(url, {
    headers: { 'X-Shopify-Access-Token': tenant.access_token }
  });
  const ordersData = res.data.orders || [];

  const ordersToInsert = [];

  for (const o of ordersData) {
    let customer_id = null;

    if (o.customer?.id) {
      const existingCustomer = await Customer.findOne({ where: { shopify_id: String(o.customer.id) } });
      if (existingCustomer) customer_id = existingCustomer.id;
    }

    ordersToInsert.push({
      shopify_id: String(o.id),
      total: parseFloat(o.total_price || 0),
      currency: o.currency || o.currency_code || '',
      customer_id,
      customer_shopify_id: o.customer?.id ? String(o.customer.id) : null,
      tenant_id: tenant.id,
      created_at: o.created_at ? new Date(o.created_at) : new Date()
    });
  }

  if (ordersToInsert.length) {
    await Order.bulkCreate(ordersToInsert, {
      updateOnDuplicate: ['total', 'currency', 'customer_id', 'customer_shopify_id']
    });
  }

  return ordersToInsert.length;
}

// ----------------------
// Express wrapper functions with debug logs
// ----------------------
async function fetchCustomers(req, res) {
  try {
    const identifier = req.params.tenantId || req.query.tenantId;
    console.log('fetchCustomers received identifier:', identifier); // debug

    const tenant = await findTenantByIdentifier(identifier);
    if (!tenant) {
      console.log('Tenant not found in fetchCustomers'); // debug
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const inserted = await syncCustomersForTenant(tenant);
    return res.json({ ok: true, inserted });
  } catch (err) {
    console.error('fetchCustomers error', err.message || err);
    return res.status(500).json({ error: err.message || 'Fetch customers failed' });
  }
}

async function fetchProducts(req, res) {
  try {
    const identifier = req.params.tenantId || req.query.tenantId;
    console.log('fetchProducts received identifier:', identifier); // debug

    const tenant = await findTenantByIdentifier(identifier);
    if (!tenant) {
      console.log('Tenant not found in fetchProducts'); // debug
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const inserted = await syncProductsForTenant(tenant);
    return res.json({ ok: true, inserted });
  } catch (err) {
    console.error('fetchProducts error', err.message || err);
    return res.status(500).json({ error: err.message || 'Fetch products failed' });
  }
}

async function fetchOrders(req, res) {
  try {
    const identifier = req.params.tenantId || req.query.tenantId;
    console.log('fetchOrders received identifier:', identifier); // debug

    const tenant = await findTenantByIdentifier(identifier);
    if (!tenant) {
      console.log('Tenant not found in fetchOrders'); // debug
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const inserted = await syncOrdersForTenant(tenant);
    return res.json({ ok: true, inserted });
  } catch (err) {
    console.error('fetchOrders error', err.message || err);
    return res.status(500).json({ error: err.message || 'Fetch orders failed' });
  }
}

async function syncAll(req, res) {
  try {
    const identifier = req.params.tenantId || req.query.tenantId;
    console.log('syncAll received identifier:', identifier); // debug

    if (!identifier) {
      const tenants = await Tenant.findAll();
      for (const t of tenants) {
        await syncCustomersForTenant(t);
        await syncProductsForTenant(t);
        await syncOrdersForTenant(t);
      }
      return res.json({ ok: true, message: '✅ Synced all tenants' });
    }

    const tenant = await findTenantByIdentifier(identifier);
    if (!tenant) {
      console.log('Tenant not found in syncAll'); // debug
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const results = {
      customers: await syncCustomersForTenant(tenant),
      products: await syncProductsForTenant(tenant),
      orders: await syncOrdersForTenant(tenant)
    };

    return res.json({ ok: true, tenant: tenant.shop_domain, results });
  } catch (err) {
    console.error('syncAll error', err.message || err);
    return res.status(500).json({ error: err.message || 'Sync failed' });
  }
}

module.exports = {
  fetchCustomers,
  fetchProducts,
  fetchOrders,
  syncAll,
  syncCustomersForTenant,
  syncProductsForTenant,
  syncOrdersForTenant
};
