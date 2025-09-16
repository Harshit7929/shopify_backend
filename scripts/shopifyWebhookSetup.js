const axios = require('axios');

async function createWebhook(tenant, topic) {
  const url = `https://${tenant.shop_domain}/admin/api/${process.env.SHOPIFY_API_VERSION}/webhooks.json`;
  const payload = {
    webhook: {
      topic,
      address: `https://your-server.com/webhook/shopify`,
      format: 'json'
    }
  };

  await axios.post(url, payload, {
    headers: { 'X-Shopify-Access-Token': tenant.access_token }
  });
}

// Usage
await createWebhook(tenant, 'checkouts/create');
await createWebhook(tenant, 'carts/update');
