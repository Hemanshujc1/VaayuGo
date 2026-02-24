const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DeliveryRule = sequelize.define('DeliveryRule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Every rule must at least belong to a location
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true, // Null means it applies to all categories in the location
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Null means it applies to all shops in the category/location
  },
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
  min_order_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Null means no minimum order constraint
  },
  small_order_delivery_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Null means strict mode (block if below min_order_value)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: "delivery_rules",
});

module.exports = DeliveryRule;
