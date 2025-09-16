const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  shopify_id: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.STRING },
  price: { type: DataTypes.DECIMAL(10,2) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'products',
  timestamps: false
});

module.exports = Product;
