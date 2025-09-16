// models/Tenant.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index'); // your existing sequelize instance

const Tenant = sequelize.define('Tenant', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING },
  shop_domain: { type: DataTypes.STRING, unique: true },
  access_token: { type: DataTypes.STRING }
}, {
  tableName: 'tenants',
  timestamps: false
});

module.exports = Tenant;
