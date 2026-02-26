const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DeliverySlot = sequelize.define('DeliverySlot', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false, // e.g. "Lunch", "Evening"
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  cutoff_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: false,
});

module.exports = DeliverySlot;
