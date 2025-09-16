const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'shopify_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',           // empty password from your .env
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306, // custom port 4306 from .env
    dialect: 'mysql',
    logging: false,                     // set true to see SQL queries
    define: {
      timestamps: false                 // disable automatic createdAt/updatedAt
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Unable to connect to database:', err));

module.exports = sequelize;
