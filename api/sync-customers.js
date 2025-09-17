import axios from 'axios';

export default async function handler(req, res) {
  try {
    const tenantId = req.query.tenantId;
    const token = process.env.SHOPIFY_PASSWORD; // or your access token
    const resData = await axios.get(`https://your-shop.myshopify.com/admin/api/2025-01/customers.json`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    res.status(200).json(resData.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
