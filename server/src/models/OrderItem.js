const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price_at_time: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Xerox specific fields
  file_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  options: {
    type: DataTypes.JSON, // Stores { copies, color, single_side, binding }
    allowNull: true,
  },
}, {
  timestamps: false,
});

module.exports = OrderItem;
