const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Customer = require('./Customer');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  shopify_id: { type: DataTypes.STRING, unique: true, allowNull: false },
  total: { type: DataTypes.DECIMAL(12,2) },
  currency: { type: DataTypes.STRING },
  customer_id: { type: DataTypes.INTEGER, allowNull: true },
  customer_shopify_id: { type: DataTypes.STRING, allowNull: true },
  tenant_id: { type: DataTypes.STRING, allowNull: false, defaultValue: 'default' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'orders',
  timestamps: false
});

Order.belongsTo(Customer, { foreignKey: 'customer_id' });

module.exports = Order;
