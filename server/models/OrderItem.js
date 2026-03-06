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
    field: 'order_id'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'product_id'
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
  product_discount: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  product_discount_type: {
    type: DataTypes.ENUM('PERCENTAGE', 'FLAT'),
    allowNull: true,
  },
  product_discount_value: {
    type: DataTypes.FLOAT,
    allowNull: true,
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
  tableName: 'OrderItems',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['product_id'] }
  ]
});

module.exports = OrderItem;
