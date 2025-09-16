const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // your DB connection
const Tenant = require('./Tenant');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'events',
  timestamps: false
});

Event.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = Event;
