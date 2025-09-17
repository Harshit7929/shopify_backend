import axios from 'axios';

export default async function handler(req, res) {
  try {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const token = process.env.SHOPIFY_PASSWORD;
    const store = process.env.SHOPIFY_STORE;

    const [customers, orders, products] = await Promise.all([
      axios.get(`https://${store}/admin/api/2025-01/customers.json`, {
        headers: { 'X-Shopify-Access-Token': token },
      }),
      axios.get(`https://${store}/admin/api/2025-01/orders.json`, {
        headers: { 'X-Shopify-Access-Token': token },
      }),
      axios.get(`https://${store}/admin/api/2025-01/products.json`, {
        headers: { 'X-Shopify-Access-Token': token },
      }),
    ]);

    res.status(200).json({
      customers: customers.data,
      orders: orders.data,
      products: products.data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync all data' });
  }
}
