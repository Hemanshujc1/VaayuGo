const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  items_total: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  delivery_fee: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  platform_fee: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  grand_total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = Order;
