const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  shopify_id: { type: DataTypes.STRING, unique: true, allowNull: false },
  first_name: { type: DataTypes.STRING },
  last_name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  tenant_id: { type: DataTypes.STRING, allowNull: false, defaultValue: 'default' },
  total_spent: { type: DataTypes.DECIMAL(10,2) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'customers',
  timestamps: false
});

module.exports = Customer;
