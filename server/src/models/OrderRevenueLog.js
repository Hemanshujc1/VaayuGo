const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderRevenueLog = sequelize.define('OrderRevenueLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  order_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  is_small_order: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  applied_delivery_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  applied_min_order_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  commission_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  shop_delivery_earned: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  vaayugo_delivery_earned: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  shop_final_earning: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  vaayugo_final_earning: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: "order_revenue_logs",
});

module.exports = OrderRevenueLog;
