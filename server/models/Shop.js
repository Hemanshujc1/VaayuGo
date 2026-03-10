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
  },
  opening_time: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Format: HH:mm'
  },
  closing_time: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Format: HH:mm'
  },
  break_start: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Format: HH:mm'
  },
  break_end: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Format: HH:mm'
  },
  closed_days: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of days shop is closed, e.g., ["Sunday", "Monday"]'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['owner_id'] },
    { fields: ['status'] },
    { fields: ['category'] }
  ]
});

module.exports = Shop;
