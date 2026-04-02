const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const XeroxDocument = sequelize.define('XeroxDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('uploaded', 'ordered', 'deleted'),
    defaultValue: 'uploaded'
  }
}, {
  timestamps: true,
  tableName: 'xerox_documents'
});

module.exports = XeroxDocument;
