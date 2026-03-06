const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Settlement = sequelize.define('Settlement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  total_orders: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  total_cod_collected: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  total_online_collected: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  commission_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  platform_discount_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  net_payout: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'disputed'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
  tableName: 'settlements',
});

module.exports = Settlement;
