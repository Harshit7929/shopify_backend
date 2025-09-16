const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'users',
  timestamps: true,            // Sequelize will manage timestamps
  createdAt: 'created_at',     // match your table column
  updatedAt: 'updated_at'      // match your table column
});

module.exports = User;
