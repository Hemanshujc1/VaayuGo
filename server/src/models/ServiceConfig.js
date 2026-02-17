const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ServiceConfig = sequelize.define('ServiceConfig', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // If null, applies to category globally
  },
  category: {
    type: DataTypes.STRING, // e.g., 'Groceries', 'Xerox'
    allowNull: true, // If null, applies globally
  },
  min_order_value: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  delivery_fee: {
    type: DataTypes.FLOAT,
    defaultValue: 10.0,
  },
  commission_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 3.0, // Percentage
  },
  delivery_revenue_share: {
    type: DataTypes.FLOAT,
    defaultValue: 7.0, // Amount shopkeeper gets from delivery fee
  },
  is_prepaid_only: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

module.exports = ServiceConfig;
