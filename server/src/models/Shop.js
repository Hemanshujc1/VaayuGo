const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Shop = sequelize.define('Shop', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // References User model ideal, but keeping simple for now
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
    defaultValue: 'pending',
  },
  is_open: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  images: {
    type: DataTypes.JSON, // Stores array of image URLs
    defaultValue: [],
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  delivery_rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  }
}, {
  timestamps: true,
});

module.exports = Shop;
