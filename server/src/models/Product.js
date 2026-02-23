const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0,
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  timestamps: true,
});

module.exports = Product;
