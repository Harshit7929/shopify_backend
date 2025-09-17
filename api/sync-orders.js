import axios from 'axios';

export default async function handler(req, res) {
  try {
    const tenantId = req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const token = process.env.SHOPIFY_PASSWORD;
    const store = process.env.SHOPIFY_STORE;

    const response = await axios.get(
      `https://${store}/admin/api/2025-01/orders.json`,
      {
        headers: { 'X-Shopify-Access-Token': token },
      }
    );

    res.status(200).json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync orders' });
  }
}
