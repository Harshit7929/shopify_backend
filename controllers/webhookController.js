// C:\Users\HP\OneDrive\Desktop\shopify\backend\controllers\webhookController.js

const Event = require('../models/Event');
const Tenant = require('../models/Tenant');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function handleShopifyWebhook(req, res) {
  try {
    const topic = req.headers['x-shopify-topic'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const payload = req.body;

    // ----------------------
    // Validate headers
    // ----------------------
    if (!topic || !shopDomain) {
      return res.status(400).send('Missing Shopify headers');
    }

    // ----------------------
    // Find tenant
    // ----------------------
    const tenant = await Tenant.findOne({ where: { shop_domain: shopDomain } });
    if (!tenant) return res.status(404).send('Tenant not found');

    // ----------------------
    // List of Shopify events to store
    // ----------------------
    const eventsToStore = [
      'checkouts/create',
      'checkouts/update',
      'carts/update',
      'orders/create',
      'orders/paid',
      'orders/cancelled',
      'customers/create',
      'customers/update',
      'products/create',
      'products/update',
      'products/delete'
    ];

    // ----------------------
    // Store event in Event table
    // ----------------------
    if (eventsToStore.includes(topic)) {
      await Event.create({
        tenant_id: tenant.id,
        event_type: topic,
        payload
      });
    }

    // ----------------------
    // Optional: map payload to tables
    // ----------------------
    switch (topic) {
      case 'customers/create':
      case 'customers/update':
        await Customer.upsert({
          tenant_id: tenant.id,
          shopify_id: String(payload.id),
          email: payload.email || null,
          first_name: payload.first_name || null,
          last_name: payload.last_name || null,
          total_spent: parseFloat(payload.total_spent || 0),
          created_at: payload.created_at ? new Date(payload.created_at) : new Date()
        });
        break;

      case 'orders/create':
      case 'orders/paid':
      case 'orders/cancelled':
        await Order.upsert({
          tenant_id: tenant.id,
          shopify_id: String(payload.id),
          email: payload.email || null,
          total: parseFloat(payload.total_price || 0),
          currency: payload.currency || payload.currency_code || '',
          created_at: payload.created_at ? new Date(payload.created_at) : new Date()
        });
        break;

      case 'products/create':
      case 'products/update':
      case 'products/delete':
        await Product.upsert({
          tenant_id: tenant.id,
          shopify_id: String(payload.id),
          title: payload.title || '',
          price: parseFloat(payload.variants?.[0]?.price || 0),
          created_at: payload.created_at ? new Date(payload.created_at) : new Date()
        });
        break;

      default:
        break;
    }

    console.log(`✅ Event stored and mapped: ${topic} for ${shopDomain}`);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = { handleShopifyWebhook };
