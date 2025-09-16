// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');

const sequelize = require('./models/index'); // Sequelize instance
const shopifyRoutes = require('./routes/shopifyRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { router: authRoutes } = require('./routes/authRoutes');
const Tenant = require('./models/Tenant');
const {
  syncCustomersForTenant,
  syncProductsForTenant,
  syncOrdersForTenant
} = require('./controllers/shopifyController');

const app = express();

// ----------------------
// Middleware
// ----------------------
app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies

// ----------------------
// Routes
// ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/shopify', shopifyRoutes); // <-- Shopify routes mounted here
app.use('/webhook', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ----------------------
// Root route for quick testing
// ----------------------
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Shopify FDE Backend</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
          a { display: block; margin: 10px 0; color: #007bff; text-decoration: none; font-weight: bold; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>✅ Shopify FDE Backend is Running!</h1>
        <p>Click the links below to test syncing (replace <b>1</b> with your tenantId):</p>
        <a href="/api/shopify/sync-customers/1" target="_blank">Sync Customers</a>
        <a href="/api/shopify/sync-orders/1" target="_blank">Sync Orders</a>
        <a href="/api/shopify/sync-products/1" target="_blank">Sync Products</a>
        <a href="/api/shopify/sync-all/1" target="_blank">Sync All (One Tenant)</a>
        <a href="/api/shopify/sync-all" target="_blank">Sync All (All Tenants)</a>
      </body>
    </html>
  `);
});

// ----------------------
// Cron Job: Sync all tenants every 15 minutes
// ----------------------
cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('⏳ Starting scheduled sync for all tenants...');
    const tenants = await Tenant.findAll();
    for (const t of tenants) {
      await syncCustomersForTenant(t);
      await syncProductsForTenant(t);
      await syncOrdersForTenant(t);
    }
    console.log('✅ Scheduled sync completed');
  } catch (err) {
    console.error('❌ Scheduled sync failed:', err.message || err);
  }
});

// ----------------------
// Start server with Sequelize sync
// ----------------------
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync tables (alter: true ensures missing columns/tables are created)
    await sequelize.sync({ alter: true });
    console.log('✅ Sequelize models synced');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message || err);
  }
})();
