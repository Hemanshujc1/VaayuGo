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
    type: DataTypes.ENUM('pending', 'accepted', 'out_for_delivery', 'delivered', 'failed', 'cancelled'),
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
  shop_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  delivery_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_rated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  delivery_otp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failure_reason: {
    type: DataTypes.ENUM('Delivery attempt was made', 'Customer was unavailable', 'Customer refused order', 'Other'),
    allowNull: true,
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelled_by: {
    type: DataTypes.ENUM('customer', 'shop', 'admin'),
    allowNull: true,
  },
  cancel_reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  final_status_locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['customer_id'] },
    { fields: ['shop_id'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Order;
