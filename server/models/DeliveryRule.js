const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DeliveryRule = sequelize.define(
  "DeliveryRule",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Normal Delivery
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    shop_delivery_share: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    vaayugo_delivery_share: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    commission_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    // Small Order Fee
    min_order_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    small_order_delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // The total customer pays for a small order
    },
    small_order_platform_share: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    small_order_shop_share: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    min_platform_revenue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    free_delivery_min_order: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Above this value, delivery_fee and small_order_delivery_fee become 0',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    tableName: "delivery_rules",
  }
);

module.exports = DeliveryRule;
